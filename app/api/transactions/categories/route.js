// app/api/transactions/categories/route.js
import { NextResponse } from "next/server";
import { txnCategoryStore } from "@/lib/txn-category-store";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json(
        { success: true, categories: {} },
        { status: 200 }
      );
    }

    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const categories = {};
    ids.forEach((id) => {
      const cat = txnCategoryStore.get(id);
      if (cat) {
        categories[id] = cat;
      }
    });

    return NextResponse.json(
      { success: true, categories },
      { status: 200 }
    );
  } catch (err) {
    console.error("[categories] error", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
