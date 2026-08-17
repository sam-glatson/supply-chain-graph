import { NextResponse } from "next/server";
import { DatabaseError, verifyConnectivity } from "@/lib/db";

export async function GET() {
  try {
    const connected = await verifyConnectivity();
    if (!connected) {
      return NextResponse.json(
        { status: "error", message: "Database unavailable" },
        { status: 503 },
      );
    }

    return NextResponse.json({ status: "ok", message: "Connected to CognoDB" });
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { status: "error", message: "Unexpected health check failure" },
      { status: 500 },
    );
  }
}
