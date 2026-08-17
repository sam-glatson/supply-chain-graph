import { NextRequest, NextResponse } from "next/server";
import { DatabaseError } from "@/lib/db";
import { getAllComponents, getAlternatives } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const componentId = request.nextUrl.searchParams.get("componentId");
  const listAll = request.nextUrl.searchParams.get("list") === "true";

  try {
    if (listAll) {
      const components = await getAllComponents();
      return NextResponse.json({ components });
    }

    if (!componentId) {
      return NextResponse.json({ error: "componentId is required" }, { status: 400 });
    }

    const alternatives = await getAlternatives(componentId);
    return NextResponse.json({ alternatives });
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({ error: "Failed to load alternatives" }, { status: 500 });
  }
}
