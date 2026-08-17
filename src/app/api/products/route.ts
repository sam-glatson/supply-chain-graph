import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "@/lib/db";
import { getProductBom, getProducts } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search") ?? undefined;

  try {
    const products = await getProducts(search);
    return NextResponse.json({ products });
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { productId?: string };
    if (!body.productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const bom = await getProductBom(body.productId);
    return NextResponse.json({ bom });
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({ error: "Failed to load product BOM" }, { status: 500 });
  }
}
