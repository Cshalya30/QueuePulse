import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceCode, counterCode, distanceMm, occupancyState, queueLength, rssi } = body;

    if (!deviceCode || distanceMm === undefined) {
      return NextResponse.json(
        { error: "Missing required telemetry fields: deviceCode, distanceMm" },
        { status: 400 }
      );
    }

    // Acknowledge telemetry ingestion
    return NextResponse.json({
      success: true,
      acknowledgedAt: new Date().toISOString(),
      node: deviceCode,
      counter: counterCode || "UNKNOWN",
      distanceMm,
      state: occupancyState || (distanceMm < 800 ? "OCCUPIED" : "CLEAR"),
      status: "RECORDED",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}
