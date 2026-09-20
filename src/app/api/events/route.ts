import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceCode, eventType, tokenCode, metadata, severity } = body;

    if (!deviceCode || !eventType) {
      return NextResponse.json(
        { error: "Missing required event fields: deviceCode, eventType" },
        { status: 400 }
      );
    }

    const eventId = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    return NextResponse.json({
      success: true,
      eventId,
      eventType,
      deviceCode,
      tokenCode: tokenCode || null,
      severity: severity || "info",
      recordedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}
