import test from "node:test";
import assert from "node:assert/strict";

/*
  Pure-JS mirror of supabase/migrations/0001_atomic_queue_ops.sql's six RPC
  functions, used to verify the BUSINESS LOGIC (allowed/rejected state
  transitions, duplicate prevention) without touching the real database —
  per the project rule to never run tests against production Supabase.

  This does NOT verify real Postgres row-locking/transaction isolation
  (FOR UPDATE / SKIP LOCKED / the partial unique index) — that requires an
  integration test against a real (local or staging) Postgres instance,
  which is a separate, still-outstanding step documented in the report.
  What IS verified here: that "first call wins, second call is rejected"
  is the correct business rule for concurrent NEXT presses and duplicate
  RFID registrations, which is what the SQL's locking is designed to
  enforce atomically.
*/

class RpcSimulator {
  constructor(seed) {
    this.counters = JSON.parse(JSON.stringify(seed.counters));
    this.tokens = JSON.parse(JSON.stringify(seed.tokens));
    this.categories = JSON.parse(JSON.stringify(seed.categories));
    this.sequences = {};
  }

  _findCounter(id) {
    const c = this.counters.find((c) => c.id === id);
    if (!c) throw new Error("COUNTER_NOT_FOUND");
    return c;
  }

  registerToken(workspaceId, categoryId, rfidUid) {
    if (rfidUid) {
      const activeStatuses = ["WAITING", "CALLED", "IN_SERVICE", "PENDING_CLEARANCE", "GRACE_QUEUE"];
      const dup = this.tokens.find((t) => t.rfidSessionUid === rfidUid && activeStatuses.includes(t.status));
      if (dup) throw new Error("DUPLICATE_ACTIVE_TOKEN");
    }
    const category = this.categories.find((c) => c.id === categoryId);
    if (!category) throw new Error("UNKNOWN_CATEGORY");

    this.sequences[categoryId] = (this.sequences[categoryId] || 0) + 1;
    const tokenCode = `${category.prefix}-${String(this.sequences[categoryId]).padStart(3, "0")}`;

    const token = {
      id: `tok-${this.tokens.length + 1}-${Date.now()}`,
      workspaceId,
      serviceCategoryId: categoryId,
      counterId: null,
      tokenCode,
      status: "WAITING",
      priority: "NORMAL",
      rfidSessionUid: rfidUid ?? null,
      rfidVerified: false,
      createdAt: new Date().toISOString(),
    };
    this.tokens.push(token);
    return token;
  }

  callNextToken(counterId) {
    const counter = this._findCounter(counterId);

    if (counter.occupancyState === "OCCUPIED" || counter.currentDistanceMm < counter.distanceThresholdMm) {
      throw new Error("DESK_OCCUPIED");
    }
    if (counter.currentTokenId) {
      const active = this.tokens.find(
        (t) => t.id === counter.currentTokenId && ["CALLED", "IN_SERVICE", "PENDING_CLEARANCE"].includes(t.status)
      );
      if (active) throw new Error("ACTIVE_SESSION_EXISTS");
    }

    const grace = this.tokens
      .filter((t) => t.serviceCategoryId === counter.serviceCategoryId && t.status === "GRACE_QUEUE")
      .sort((a, b) => new Date(a.movedToGraceAt) - new Date(b.movedToGraceAt))[0];
    const waiting = this.tokens
      .filter((t) => t.serviceCategoryId === counter.serviceCategoryId && t.status === "WAITING")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
    const eligible = grace || waiting;
    if (!eligible) throw new Error("QUEUE_EMPTY");

    eligible.status = "CALLED";
    eligible.counterId = counterId;
    eligible.calledAt = new Date().toISOString();
    counter.currentTokenId = eligible.id;
    return eligible;
  }

  verifyTokenRfid(counterId, rfidUid) {
    const counter = this._findCounter(counterId);
    if (!counter.currentTokenId) throw new Error("NO_ACTIVE_TOKEN");
    const token = this.tokens.find((t) => t.id === counter.currentTokenId);
    if (token.status !== "CALLED") throw new Error("TOKEN_NOT_CALLED");
    if (token.rfidSessionUid && token.rfidSessionUid !== rfidUid) throw new Error("RFID_MISMATCH");

    token.status = "IN_SERVICE";
    token.serviceStartedAt = new Date().toISOString();
    token.rfidVerified = true;
    token.rfidSessionUid = rfidUid;
    counter.occupancyState = "OCCUPIED";
    return token;
  }

  completeToken(counterId) {
    const counter = this._findCounter(counterId);
    if (!counter.currentTokenId) throw new Error("NO_ACTIVE_TOKEN");
    const token = this.tokens.find((t) => t.id === counter.currentTokenId);
    if (token.status !== "IN_SERVICE") throw new Error("TOKEN_NOT_IN_SERVICE");

    token.status = "COMPLETED";
    token.serviceCompletedAt = new Date().toISOString();
    const isClear = counter.currentDistanceMm >= counter.distanceThresholdMm;
    counter.occupancyState = isClear ? "CLEAR" : "OCCUPIED";
    if (isClear) counter.currentTokenId = null;
    return token;
  }

  reportClearance(counterId, distanceMm) {
    const counter = this._findCounter(counterId);
    const isClear = distanceMm >= counter.distanceThresholdMm;
    if (isClear && counter.currentTokenId) {
      const token = this.tokens.find((t) => t.id === counter.currentTokenId);
      if (token && ["COMPLETED", "MISSED", "CANCELLED"].includes(token.status)) {
        counter.currentTokenId = null;
      }
    }
    counter.currentDistanceMm = distanceMm;
    counter.occupancyState = isClear ? "CLEAR" : "OCCUPIED";
    return counter;
  }

  moveTokenToGrace(counterId) {
    const counter = this._findCounter(counterId);
    if (!counter.currentTokenId) throw new Error("NO_ACTIVE_TOKEN");
    const token = this.tokens.find((t) => t.id === counter.currentTokenId);
    if (token.status !== "CALLED") throw new Error("TOKEN_NOT_CALLED");

    token.status = "GRACE_QUEUE";
    token.priority = "GRACE";
    token.movedToGraceAt = new Date().toISOString();
    token.counterId = null;
    counter.currentTokenId = null;
    return token;
  }
}

const seed = () => ({
  categories: [{ id: "cat-doc", prefix: "DOC" }],
  counters: [
    {
      id: "cnt-01",
      serviceCategoryId: "cat-doc",
      occupancyState: "CLEAR",
      currentDistanceMm: 1200,
      distanceThresholdMm: 800,
      currentTokenId: null,
    },
  ],
  tokens: [],
});

// ---- 1. register_token ----
test("register_token: duplicate RFID scan on an active token is rejected", () => {
  const sim = new RpcSimulator(seed());
  sim.registerToken("ws-1", "cat-doc", "UID-AA-11");
  assert.throws(() => sim.registerToken("ws-1", "cat-doc", "UID-AA-11"), /DUPLICATE_ACTIVE_TOKEN/);
  assert.equal(sim.tokens.length, 1);
});

test("register_token: same RFID can register again once the prior token is COMPLETED", () => {
  const sim = new RpcSimulator(seed());
  const t1 = sim.registerToken("ws-1", "cat-doc", "UID-AA-11");
  t1.status = "COMPLETED";
  const t2 = sim.registerToken("ws-1", "cat-doc", "UID-AA-11");
  assert.equal(t2.tokenCode, "DOC-002");
});

test("register_token: sequential numbering is independent per category", () => {
  const sim = new RpcSimulator({
    categories: [{ id: "cat-doc", prefix: "DOC" }, { id: "cat-acc", prefix: "ACC" }],
    counters: [],
    tokens: [],
  });
  const a = sim.registerToken("ws-1", "cat-doc", null);
  const b = sim.registerToken("ws-1", "cat-acc", null);
  const c = sim.registerToken("ws-1", "cat-doc", null);
  assert.equal(a.tokenCode, "DOC-001");
  assert.equal(b.tokenCode, "ACC-001");
  assert.equal(c.tokenCode, "DOC-002");
});

// ---- 2. call_next_token ----
test("call_next_token: concurrent NEXT presses — first call claims the token, second is rejected", () => {
  const sim = new RpcSimulator(seed());
  sim.registerToken("ws-1", "cat-doc", null);
  sim.registerToken("ws-1", "cat-doc", null);

  const first = sim.callNextToken("cnt-01");
  assert.equal(first.status, "CALLED");

  // A second NEXT press arriving before the first session resolves must
  // not claim a second token for the same counter.
  assert.throws(() => sim.callNextToken("cnt-01"), /ACTIVE_SESSION_EXISTS/);
  assert.equal(sim.tokens.filter((t) => t.status === "CALLED").length, 1);
});

test("call_next_token: rejected when desk is occupied", () => {
  const sim = new RpcSimulator(seed());
  sim.counters[0].occupancyState = "OCCUPIED";
  sim.registerToken("ws-1", "cat-doc", null);
  assert.throws(() => sim.callNextToken("cnt-01"), /DESK_OCCUPIED/);
});

test("call_next_token: rejected when queue is empty", () => {
  const sim = new RpcSimulator(seed());
  assert.throws(() => sim.callNextToken("cnt-01"), /QUEUE_EMPTY/);
});

test("call_next_token: Grace Queue tokens take priority over FIFO waiting", () => {
  const sim = new RpcSimulator(seed());
  const waiting = sim.registerToken("ws-1", "cat-doc", null);
  const grace = sim.registerToken("ws-1", "cat-doc", null);
  grace.status = "GRACE_QUEUE";
  grace.movedToGraceAt = new Date().toISOString();

  const called = sim.callNextToken("cnt-01");
  assert.equal(called.id, grace.id);
  assert.notEqual(called.id, waiting.id);
});

// ---- 3. verify_token_rfid ----
test("verify_token_rfid: invalid transition — token not in CALLED state", () => {
  const sim = new RpcSimulator(seed());
  const t = sim.registerToken("ws-1", "cat-doc", null);
  sim.callNextToken("cnt-01");
  t.status = "IN_SERVICE"; // already in service
  assert.throws(() => sim.verifyTokenRfid("cnt-01", "UID-X"), /TOKEN_NOT_CALLED/);
});

test("verify_token_rfid: UID mismatch is rejected, token stays CALLED", () => {
  const sim = new RpcSimulator(seed());
  sim.registerToken("ws-1", "cat-doc", "UID-AA-11");
  sim.callNextToken("cnt-01");
  assert.throws(() => sim.verifyTokenRfid("cnt-01", "UID-WRONG"), /RFID_MISMATCH/);
  assert.equal(sim.tokens[0].status, "CALLED");
});

// ---- 4. complete_token ----
test("complete_token: invalid transition — double DONE press is rejected", () => {
  const sim = new RpcSimulator(seed());
  sim.registerToken("ws-1", "cat-doc", "UID-AA-11");
  sim.callNextToken("cnt-01");
  sim.verifyTokenRfid("cnt-01", "UID-AA-11");
  sim.completeToken("cnt-01");
  assert.throws(() => sim.completeToken("cnt-01"), /NO_ACTIVE_TOKEN|TOKEN_NOT_IN_SERVICE/);
});

// ---- 5. report_clearance ----
test("report_clearance: unassigns counter only once token is COMPLETED/MISSED/CANCELLED", () => {
  const sim = new RpcSimulator(seed());
  sim.registerToken("ws-1", "cat-doc", "UID-AA-11");
  sim.callNextToken("cnt-01");
  sim.verifyTokenRfid("cnt-01", "UID-AA-11");

  // Student steps back mid-service — desk reads clear, but token is still IN_SERVICE.
  sim.reportClearance("cnt-01", 1500);
  assert.notEqual(sim.counters[0].currentTokenId, null);

  sim.completeToken("cnt-01");
  sim.counters[0].currentDistanceMm = 400; // still physically present right after DONE
  sim.reportClearance("cnt-01", 1500);
  assert.equal(sim.counters[0].currentTokenId, null);
});

// ---- 6. move_token_to_grace ----
test("move_token_to_grace: invalid transition — can't grace a token that's already IN_SERVICE", () => {
  const sim = new RpcSimulator(seed());
  sim.registerToken("ws-1", "cat-doc", "UID-AA-11");
  sim.callNextToken("cnt-01");
  sim.verifyTokenRfid("cnt-01", "UID-AA-11");
  assert.throws(() => sim.moveTokenToGrace("cnt-01"), /TOKEN_NOT_CALLED/);
});

test("move_token_to_grace: missed token frees the counter, and is recalled with Grace priority ahead of FIFO waiting", () => {
  const sim = new RpcSimulator(seed());
  sim.registerToken("ws-1", "cat-doc", "UID-AA-11");
  sim.registerToken("ws-1", "cat-doc", "UID-BB-22");
  sim.callNextToken("cnt-01"); // claims UID-AA-11
  sim.moveTokenToGrace("cnt-01"); // UID-AA-11 missed -> Grace Queue

  assert.equal(sim.counters[0].currentTokenId, null);
  const next = sim.callNextToken("cnt-01");
  // Grace Queue (UID-AA-11) outranks the still-FIFO-waiting UID-BB-22.
  assert.equal(next.rfidSessionUid, "UID-AA-11");
});
