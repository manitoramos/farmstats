import { createClient } from "@/lib/supabase/server"
import type { Boss, LootItem, FarmRun, FarmRunLoot, FarmStats } from "./types"

export async function getBosses(): Promise<Boss[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("bosses").select("*").order("name")

  if (error) throw error
  return data || []
}

export async function getLootItemsByBoss(bossId: string): Promise<LootItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("loot_items")
    .select("*")
    .eq("boss_id", bossId)
    .order("rarity", { ascending: false })

  if (error) throw error
  return data || []
}

export async function getFarmRuns(
  userId: string,
  bossId?: string,
  startDate?: string,
  endDate?: string,
): Promise<FarmRun[]> {
  const supabase = await createClient()
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
    .eq("user_id", userId)
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

  if (error) throw error
  return data || []
}

export async function createFarmRun(farmRun: Omit<FarmRun, "id" | "created_at" | "updated_at">): Promise<FarmRun> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("farm_runs")
    .insert(farmRun)
    .select(`
      *,
      boss:bosses(*),
      loot:farm_run_loot(
        *,
        loot_item:loot_items(*)
      )
    `)
    .single()

  if (error) throw error
  return data
}

export async function updateFarmRun(id: string, updates: Partial<FarmRun>): Promise<FarmRun> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("farm_runs")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(`
      *,
      boss:bosses(*),
      loot:farm_run_loot(
        *,
        loot_item:loot_items(*)
      )
    `)
    .single()

  if (error) throw error
  return data
}

export async function deleteFarmRun(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("farm_runs").delete().eq("id", id)

  if (error) throw error
}

export async function addFarmRunLoot(loot: Omit<FarmRunLoot, "id" | "created_at">[]): Promise<FarmRunLoot[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("farm_run_loot")
    .insert(loot)
    .select(`
      *,
      loot_item:loot_items(*)
    `)

  if (error) throw error
  return data || []
}

export async function getFarmStats(userId: string, bossId?: string, year?: number, month?: number): Promise<FarmStats> {
  const supabase = await createClient()

  let query = supabase.from("farm_runs").select("date, kills, chests, total_earnings").eq("user_id", userId)

  if (bossId) {
    query = query.eq("boss_id", bossId)
  }

  if (year && month) {
    const startDate = `${year}-${month.toString().padStart(2, "0")}-01`
    const endDate = `${year}-${month.toString().padStart(2, "0")}-31`
    query = query.gte("date", startDate).lte("date", endDate)
  }

  const { data, error } = await query

  if (error) throw error

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

  return {
    totalDays,
    totalKills,
    totalChests,
    totalEarnings,
    averageKillsPerDay: totalDays > 0 ? totalKills / totalDays : 0,
    averageEarningsPerDay: totalDays > 0 ? totalEarnings / totalDays : 0,
    bestDay,
  }
}
