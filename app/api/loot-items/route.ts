import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const bossId = searchParams.get("bossId")

    let query = supabase.from("loot_items").select("*").order("name")

    if (bossId) {
      query = query.eq("boss_id", bossId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching loot items:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ lootItems: data || [] })
  } catch (error) {
    console.error("[v0] Error in loot-items GET:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, basePrice } = body

    // Update the loot item price
    const { data, error } = await supabase
      .from("loot_items")
      .update({ base_price: basePrice })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating loot item:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Record price history
    const { error: historyError } = await supabase.from("price_history").insert({
      loot_item_id: id,
      price: basePrice,
      recorded_by: user.id,
    })

    if (historyError) {
      console.error("[v0] Error recording price history:", historyError)
    }

    return NextResponse.json({ success: true, lootItem: data })
  } catch (error) {
    console.error("[v0] Error in loot-items PUT:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
