import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "@/lib/db";
import { getSupplierDetail, getSuppliers } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get("region") ?? undefined;
  const tier = request.nextUrl.searchParams.get("tier") ?? undefined;
  const id = request.nextUrl.searchParams.get("id");

  try {
    if (id) {
      const supplier = await getSupplierDetail(id);
      if (!supplier) {
        return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
      }
      return NextResponse.json({ supplier });
    }

    const suppliers = await getSuppliers({ region, tier });
    return NextResponse.json({ suppliers });
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({ error: "Failed to load suppliers" }, { status: 500 });
  }
}
