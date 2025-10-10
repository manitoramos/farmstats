import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const lootItemId = searchParams.get("lootItemId")

    if (!lootItemId) {
      return NextResponse.json({ error: "lootItemId is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("price_history")
      .select("*")
      .eq("loot_item_id", lootItemId)
      .order("date", { ascending: true })
      .limit(30) // Last 30 entries

    if (error) {
      console.error("[v0] Error fetching price history:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ priceHistory: data || [] })
  } catch (error) {
    console.error("[v0] Error in price-history GET:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
