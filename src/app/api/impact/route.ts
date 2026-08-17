import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "@/lib/db";
import { getComponentImpact, getSupplierImpact } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const supplierId = request.nextUrl.searchParams.get("supplierId");
  const componentId = request.nextUrl.searchParams.get("componentId");

  if (!supplierId && !componentId) {
    return NextResponse.json(
      { error: "Provide supplierId or componentId" },
      { status: 400 },
    );
  }

  try {
    const results = supplierId
      ? await getSupplierImpact(supplierId)
      : await getComponentImpact(componentId!);

    return NextResponse.json({ results, type: supplierId ? "supplier" : "component" });
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({ error: "Failed to run impact analysis" }, { status: 500 });
  }
}
