import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
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
    const { bossId, date, kills, chests, timeSpent, totalEarnings, notes, loot } = body

    const formattedDate = normalizeDate(date)

    // Create the farm run
    const { data: farmRun, error: farmRunError } = await supabase
      .from("farm_runs")
      .insert({
        user_id: user.id,
        boss_id: bossId,
        date: formattedDate,
        kills,
        chests,
        time_spent: timeSpent,
        total_earnings: totalEarnings,
        notes,
      })
      .select()
      .single()

    if (farmRunError) {
      console.error("[v0] Error creating farm run:", farmRunError)
      return NextResponse.json({ error: farmRunError.message }, { status: 500 })
    }

    // Add loot items if provided
    if (loot && loot.length > 0) {
      // First, get or create loot items
      const lootItemsToInsert = []

      for (const item of loot) {
        // Check if loot item exists
        const { data: existingItem } = await supabase
          .from("loot_items")
          .select("id")
          .eq("boss_id", bossId)
          .eq("name", item.name)
          .single()

        let lootItemId = existingItem?.id

        // If it doesn't exist, create it
        if (!lootItemId) {
          const { data: newItem, error: itemError } = await supabase
            .from("loot_items")
            .insert({
              boss_id: bossId,
              name: item.name,
              base_price: item.price,
              rarity: "common", // Default rarity
            })
            .select("id")
            .single()

          if (itemError) {
            console.error("[v0] Error creating loot item:", itemError)
            continue
          }

          lootItemId = newItem.id
        }

        lootItemsToInsert.push({
          farm_run_id: farmRun.id,
          loot_item_id: lootItemId,
          quantity: item.quantity,
          price_at_time: item.price,
        })
      }

      // Insert all loot items for this farm run
      if (lootItemsToInsert.length > 0) {
        const { error: lootError } = await supabase.from("farm_run_loot").insert(lootItemsToInsert)

        if (lootError) {
          console.error("[v0] Error adding loot items:", lootError)
        }
      }
    }

    return NextResponse.json({ success: true, farmRun })
  } catch (error) {
    console.error("[v0] Error in farm-runs POST:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const bossId = searchParams.get("bossId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let query = supabase
      .from("farm_runs")
      .select(`
        *,
        boss:bosses(*),
        loot:farm_run_loot(
          *,
          loot_item:loot_items(*)
        )
      `)
      .eq("user_id", user.id)
      .order("date", { ascending: false })

    if (bossId) {
      query = query.eq("boss_id", bossId)
    }

    if (startDate) {
      query = query.gte("date", startDate)
    }

    if (endDate) {
      query = query.lte("date", endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching farm runs:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ farmRuns: data || [] })
  } catch (error) {
    console.error("[v0] Error in farm-runs GET:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}


function normalizeDate(dateStr: string): string {
  // Already ISO-like format → YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || /^\d{4}\/\d{2}\/\d{2}$/.test(dateStr)) {
    return dateStr.replace(/\//g, "-") // ensure it's using hyphens
  }

  // European format → DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split("/")
    return `${year}-${month}-${day}`
  }

  // If it's something else — try Date parsing as a fallback
  const parsed = new Date(dateStr)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0]
  }

  throw new Error(`Invalid date format: ${dateStr}`)
}

