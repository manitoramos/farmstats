export interface Boss {
  id: string
  name: string
  description?: string
  image_url?: string
  created_at?: string
}

export interface LootItem {
  id: string
  name: string
  boss_id: string
  base_price: number
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
  created_at?: string
}

export interface FarmRun {
  id: string
  user_id: string
  boss_id: string
  date: string
  kills: number
  chests: number
  time_spent: number // in minutes
  total_earnings: number
  notes?: string
  created_at?: string
  updated_at?: string
  boss?: Boss
  loot?: FarmRunLoot[]
}

export interface FarmRunLoot {
  id: string
  farm_run_id: string
  loot_item_id: string
  quantity: number
  price_per_item: number
  total_value: number
  created_at?: string
  loot_item?: LootItem
}

export interface PriceHistory {
  id: string
  loot_item_id: string
  price: number
  date: string
  created_at?: string
}

export interface FarmStats {
  totalDays: number
  totalKills: number
  totalChests: number
  totalEarnings: number
  averageKillsPerDay: number
  averageEarningsPerDay: number
  bestDay: {
    date: string
    kills: number
    earnings: number
  }
}
