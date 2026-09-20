import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: "OK",
    service: "QueuePulse Token Engine",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { categoryCode, priority } = body;

    const prefix = (categoryCode || "DOC").toUpperCase();
    const randNum = Math.floor(Math.random() * 800 + 100);
    const tokenCode = `${prefix}-${randNum}`;

    return NextResponse.json({
      success: true,
      tokenCode,
      category: prefix,
      priority: priority || "NORMAL",
      createdAt: new Date().toISOString(),
      status: "WAITING",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid token creation payload" },
      { status: 400 }
    );
  }
}
