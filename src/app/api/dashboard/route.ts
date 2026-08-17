import { NextResponse } from "next/server";
import { DatabaseError } from "@/lib/db";
import {
  getDashboardStats,
  getRegionalConcentrationRisks,
  getSinglePointOfFailureRisks,
} from "@/lib/queries";

export async function GET() {
  try {
    const [stats, risks, regionalRisks] = await Promise.all([
      getDashboardStats(),
      getSinglePointOfFailureRisks(),
      getRegionalConcentrationRisks(),
    ]);

    return NextResponse.json({ stats, risks, regionalRisks });
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
