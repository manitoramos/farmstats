import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { FarmStats } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const bossId = searchParams.get("bossId")
    const year = searchParams.get("year")
    const month = searchParams.get("month")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    let query = supabase.from("farm_runs").select("date, kills, chests, total_earnings").eq("user_id", userId)

    if (bossId) {
      query = query.eq("boss_id", bossId)
    }

    if (year && month) {
      const startDate = `${year}-${month.toString().padStart(2, "0")}-01`
      const lastDay = new Date(Number.parseInt(year), Number.parseInt(month), 0).getDate()
      const endDate = `${year}-${month.toString().padStart(2, "0")}-${lastDay.toString().padStart(2, "0")}`
      query = query.gte("date", startDate).lte("date", endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch farm stats" }, { status: 500 })
    }

    const runs = data || []
    const totalDays = runs.length
    const totalKills = runs.reduce((sum, run) => sum + run.kills, 0)
    const totalChests = runs.reduce((sum, run) => sum + run.chests, 0)
    const totalEarnings = runs.reduce((sum, run) => sum + run.total_earnings, 0)

    const bestDay = runs.reduce(
      (best, run) => {
        if (run.total_earnings > best.earnings) {
          return { date: run.date, kills: run.kills, earnings: run.total_earnings }
        }
        return best
      },
      { date: "", kills: 0, earnings: 0 },
    )

    const stats: FarmStats = {
      totalDays,
      totalKills,
      totalChests,
      totalEarnings,
      averageKillsPerDay: totalDays > 0 ? totalKills / totalDays : 0,
      averageEarningsPerDay: totalDays > 0 ? totalEarnings / totalDays : 0,
      bestDay,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
