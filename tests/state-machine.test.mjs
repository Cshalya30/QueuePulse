import test from "node:test";
import assert from "node:assert/strict";

// Reusable State Machine Engine for deterministic logic testing
class QueueStateMachine {
  constructor(initialData) {
    this.counters = JSON.parse(JSON.stringify(initialData.counters));
    this.tokens = JSON.parse(JSON.stringify(initialData.tokens));
    this.events = [];
  }

  addEvent(evt) {
    this.events.unshift({ ...evt, id: `evt-${Date.now()}` });
  }

  isCounterCallBlocked(counterId) {
    const counter = this.counters.find((c) => c.id === counterId);
    if (!counter) return { blocked: true, reason: "Counter not found" };

    const isPhysicallyOccupied =
      counter.occupancyState === "OCCUPIED" ||
      counter.currentDistanceMm < counter.distanceThresholdMm;

    if (isPhysicallyOccupied) {
      return {
        blocked: true,
        reason: `Desk Occupied — Counter must be clear (ToF > ${counter.distanceThresholdMm}mm) before calling the next token.`,
      };
    }

    if (counter.currentTokenId) {
      const activeToken = this.tokens.find(
        (t) =>
          t.id === counter.currentTokenId &&
          (t.status === "CALLED" || t.status === "IN_SERVICE" || t.status === "PENDING_CLEARANCE")
      );
      if (activeToken) {
        return {
          blocked: true,
          reason: `Active session in progress (${activeToken.tokenCode} is ${activeToken.status}). Complete or release active session first.`,
        };
      }
    }

    return { blocked: false };
  }

  callNextToken(counterId) {
    const counter = this.counters.find((c) => c.id === counterId);
    if (!counter) return { success: false, reason: "Counter not found" };

    // Guard 1: Physical Clearance Lock
    const isPhysicallyOccupied =
      counter.occupancyState === "OCCUPIED" ||
      counter.currentDistanceMm < counter.distanceThresholdMm;

    if (isPhysicallyOccupied) {
      this.addEvent({
        counterId,
        eventType: "OPERATOR_OVERRIDE",
        severity: "warning",
        title: `Call Blocked: Desk ${counter.code} Occupied`,
        reason: "DESK_OCCUPIED",
      });
      return {
        success: false,
        reason: `Desk Occupied — Counter must be clear (ToF > ${counter.distanceThresholdMm}mm) before calling the next token.`,
      };
    }

    // Guard 2: Duplicate Call Prevention
    if (counter.currentTokenId) {
      const activeToken = this.tokens.find(
        (t) =>
          t.id === counter.currentTokenId &&
          (t.status === "CALLED" || t.status === "IN_SERVICE" || t.status === "PENDING_CLEARANCE")
      );

      if (activeToken) {
        this.addEvent({
          counterId,
          eventType: "OPERATOR_OVERRIDE",
          severity: "warning",
          title: `Duplicate Call Rejected on ${counter.code}`,
          reason: "ACTIVE_SESSION_EXISTS",
        });
        return {
          success: false,
          reason: `Active session in progress (${activeToken.tokenCode} is ${activeToken.status}).`,
        };
      }
    }

    // Guard 3: Eligible token selection
    const eligibleToken =
      this.tokens.find(
        (t) => t.serviceCategoryId === counter.serviceCategoryId && t.status === "GRACE_QUEUE"
      ) ||
      this.tokens.find(
        (t) => t.serviceCategoryId === counter.serviceCategoryId && t.status === "WAITING"
      );

    if (!eligibleToken) {
      return { success: false, reason: "No waiting tokens available in queue." };
    }

    eligibleToken.status = "CALLED";
    eligibleToken.calledAt = new Date().toISOString();
    eligibleToken.counterId = counterId;

    counter.currentTokenId = eligibleToken.id;
    counter.queueLength = Math.max(0, counter.queueLength - 1);

    this.addEvent({
      counterId,
      tokenId: eligibleToken.id,
      eventType: "TOKEN_CALLED",
      severity: "info",
      title: `Token ${eligibleToken.tokenCode} Called`,
    });

    return { success: true };
  }

  triggerRfidTap(counterId, customUid, match = true) {
    const counter = this.counters.find((c) => c.id === counterId);
    if (!counter || !counter.currentTokenId) return { success: false, reason: "No active token on counter." };

    const currentToken = this.tokens.find((t) => t.id === counter.currentTokenId);
    if (!currentToken || currentToken.status !== "CALLED") {
      this.addEvent({
        counterId,
        eventType: "RFID_REJECTED",
        severity: "warning",
        title: "RFID Ignored: Session Not in CALLED State",
      });
      return { success: false, reason: "Token not in CALLED state." };
    }

    const uid = customUid || "9A-C4-12-88";

    if (match) {
      currentToken.status = "IN_SERVICE";
      currentToken.serviceStartedAt = new Date().toISOString();
      currentToken.rfidVerified = true;
      currentToken.rfidSessionUid = uid;

      counter.occupancyState = "OCCUPIED";
      counter.currentDistanceMm = 420;

      this.addEvent({
        counterId,
        tokenId: currentToken.id,
        eventType: "RFID_VERIFIED",
        severity: "success",
        title: `RFID Verified: ${currentToken.tokenCode}`,
      });
      return { success: true };
    } else {
      this.addEvent({
        counterId,
        tokenId: currentToken.id,
        eventType: "RFID_REJECTED",
        severity: "warning",
        title: `RFID Mismatch on ${counter.code}: Access Denied`,
        reason: "UID_MISMATCH",
      });
      return { success: false, reason: "RFID UID mismatch. Token remains in CALLED state." };
    }
  }

  triggerServiceDone(counterId) {
    const counter = this.counters.find((c) => c.id === counterId);
    if (!counter || !counter.currentTokenId) return { success: false, reason: "No active token." };

    const currentToken = this.tokens.find((t) => t.id === counter.currentTokenId);
    if (!currentToken || currentToken.status !== "IN_SERVICE") {
      return { success: false, reason: "Token is not in IN_SERVICE status." };
    }

    currentToken.status = "COMPLETED";
    currentToken.serviceCompletedAt = new Date().toISOString();
    currentToken.serviceSeconds = 480;

    const isClear = counter.currentDistanceMm >= counter.distanceThresholdMm;
    counter.occupancyState = isClear ? "CLEAR" : "OCCUPIED";
    if (isClear) counter.currentTokenId = null;

    this.addEvent({
      counterId,
      tokenId: currentToken.id,
      eventType: "SERVICE_COMPLETED",
      severity: "success",
      title: `Service Complete: ${currentToken.tokenCode}`,
    });

    return { success: true };
  }

  triggerClearance(counterId, distanceMm) {
    const counter = this.counters.find((c) => c.id === counterId);
    if (!counter) return;

    const isClear = distanceMm >= counter.distanceThresholdMm;
    counter.currentDistanceMm = distanceMm;
    counter.occupancyState = isClear ? "CLEAR" : "OCCUPIED";

    if (isClear && counter.currentTokenId) {
      const assignedToken = this.tokens.find((t) => t.id === counter.currentTokenId);
      if (assignedToken && (assignedToken.status === "COMPLETED" || assignedToken.status === "MISSED")) {
        counter.currentTokenId = null;
      }
    }
  }

  triggerMissedToken(counterId) {
    const counter = this.counters.find((c) => c.id === counterId);
    if (!counter || !counter.currentTokenId) return { success: false, reason: "No token." };

    const currentToken = this.tokens.find((t) => t.id === counter.currentTokenId);
    if (!currentToken || currentToken.status !== "CALLED") {
      return { success: false, reason: "Only CALLED tokens can be shifted to Grace Queue." };
    }

    currentToken.status = "GRACE_QUEUE";
    currentToken.priority = "GRACE";
    currentToken.missedAt = new Date().toISOString();
    currentToken.movedToGraceAt = new Date().toISOString();
    currentToken.counterId = null;

    counter.currentTokenId = null;

    this.addEvent({
      counterId,
      tokenId: currentToken.id,
      eventType: "TOKEN_MOVED_TO_GRACE",
      severity: "warning",
      title: `${currentToken.tokenCode} -> Grace Queue`,
    });

    return { success: true };
  }
}

// SAMPLE TEST SEED
const createTestState = () => ({
  counters: [
    {
      id: "cnt-01",
      code: "DOC-01",
      serviceCategoryId: "cat-doc",
      occupancyState: "OCCUPIED",
      currentDistanceMm: 440,
      distanceThresholdMm: 800,
      fullExitThresholdMm: 1400,
      currentTokenId: "tok-01",
      queueLength: 2,
    },
    {
      id: "cnt-02",
      code: "DOC-02",
      serviceCategoryId: "cat-doc",
      occupancyState: "CLEAR",
      currentDistanceMm: 1420,
      distanceThresholdMm: 800,
      fullExitThresholdMm: 1400,
      currentTokenId: null,
      queueLength: 2,
    },
  ],
  tokens: [
    { id: "tok-01", tokenCode: "DOC-024", serviceCategoryId: "cat-doc", status: "IN_SERVICE", counterId: "cnt-01" },
    { id: "tok-02", tokenCode: "DOC-025", serviceCategoryId: "cat-doc", status: "WAITING", counterId: null },
    { id: "tok-03", tokenCode: "DOC-026", serviceCategoryId: "cat-doc", status: "WAITING", counterId: null },
  ],
});

// TEST CASES
test("1. Calling a token when counter is physically occupied is rejected", () => {
  const machine = new QueueStateMachine(createTestState());
  const result = machine.callNextToken("cnt-01"); // cnt-01 is occupied (440mm < 800mm)

  assert.equal(result.success, false);
  assert.match(result.reason, /Desk Occupied/);
  assert.equal(machine.tokens.find((t) => t.id === "tok-02").status, "WAITING"); // tok-02 remains waiting
  assert.equal(machine.events[0].eventType, "OPERATOR_OVERRIDE");
});

test("2. Calling a token when an active session exists on counter is rejected", () => {
  const state = createTestState();
  state.counters[1].currentTokenId = "tok-01"; // Assign active token to cnt-02
  const machine = new QueueStateMachine(state);

  const result = machine.callNextToken("cnt-02");
  assert.equal(result.success, false);
  assert.match(result.reason, /Active session in progress/);
  assert.equal(machine.tokens.find((t) => t.id === "tok-02").status, "WAITING");
});

test("3. Correct RFID authentication transitions token to IN_SERVICE", () => {
  const state = createTestState();
  state.tokens[1].status = "CALLED";
  state.counters[1].currentTokenId = "tok-02";
  const machine = new QueueStateMachine(state);

  const result = machine.triggerRfidTap("cnt-02", "9A-C4-12-88", true);
  assert.equal(result.success, true);
  assert.equal(machine.tokens.find((t) => t.id === "tok-02").status, "IN_SERVICE");
  assert.equal(machine.tokens.find((t) => t.id === "tok-02").rfidVerified, true);
  assert.equal(machine.events[0].eventType, "RFID_VERIFIED");
});

test("4. Incorrect RFID authentication halts service start and keeps token CALLED", () => {
  const state = createTestState();
  state.tokens[1].status = "CALLED";
  state.counters[1].currentTokenId = "tok-02";
  const machine = new QueueStateMachine(state);

  const result = machine.triggerRfidTap("cnt-02", "FF-00-00-00", false);
  assert.equal(result.success, false);
  assert.equal(machine.tokens.find((t) => t.id === "tok-02").status, "CALLED"); // Not in service!
  assert.equal(machine.tokens.find((t) => t.id === "tok-02").rfidVerified, undefined);
  assert.equal(machine.events[0].eventType, "RFID_REJECTED");
});

test("5. Missed token transitions to Grace Queue without dropping token history", () => {
  const state = createTestState();
  state.tokens[1].status = "CALLED";
  state.counters[1].currentTokenId = "tok-02";
  const machine = new QueueStateMachine(state);

  const result = machine.triggerMissedToken("cnt-02");
  assert.equal(result.success, true);
  const token = machine.tokens.find((t) => t.id === "tok-02");
  assert.equal(token.status, "GRACE_QUEUE");
  assert.equal(token.priority, "GRACE");
  assert.equal(token.counterId, null);
  assert.equal(machine.counters[1].currentTokenId, null);
  assert.equal(machine.events[0].eventType, "TOKEN_MOVED_TO_GRACE");
});

test("6. Service completion and ToF clearance flow properly", () => {
  const machine = new QueueStateMachine(createTestState());

  // Staff presses service done while student is still at counter (440mm)
  const doneResult = machine.triggerServiceDone("cnt-01");
  assert.equal(doneResult.success, true);
  assert.equal(machine.tokens.find((t) => t.id === "tok-01").status, "COMPLETED");
  assert.equal(machine.counters[0].occupancyState, "OCCUPIED"); // Desk still physically occupied
  assert.equal(machine.isCounterCallBlocked("cnt-01").blocked, true); // Cannot call next yet!

  // Student departs (ToF distance reaches 1450mm)
  machine.triggerClearance("cnt-01", 1450);
  assert.equal(machine.counters[0].occupancyState, "CLEAR");
  assert.equal(machine.counters[0].currentTokenId, null); // Unassigned
  assert.equal(machine.isCounterCallBlocked("cnt-01").blocked, false); // Now ready for next call!

  // Next token can now be called safely
  const callResult = machine.callNextToken("cnt-01");
  assert.equal(callResult.success, true);
  assert.equal(machine.tokens.find((t) => t.id === "tok-02").status, "CALLED");
});

test("7. Repeated button presses do not spawn duplicate events or corrupt session", () => {
  const machine = new QueueStateMachine(createTestState());

  // Repeatedly call Service Done
  const r1 = machine.triggerServiceDone("cnt-01");
  assert.equal(r1.success, true);
  const r2 = machine.triggerServiceDone("cnt-01");
  assert.equal(r2.success, false); // Rejected! Already completed

  // Repeatedly tap RFID on uncalled token
  const r3 = machine.triggerRfidTap("cnt-01", "AA-BB-CC-DD", true);
  assert.equal(r3.success, false); // Rejected! Token is COMPLETED, not CALLED
});
