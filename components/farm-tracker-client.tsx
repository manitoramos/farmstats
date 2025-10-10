"use client"

import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { BossSelector } from "@/components/boss-selector"
import { FarmDashboard } from "@/components/farm-dashboard"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { Boss } from "@/lib/types"

interface FarmTrackerClientProps {
  user: User
}

export function FarmTrackerClient({ user }: FarmTrackerClientProps) {
  const [selectedBoss, setSelectedBoss] = useState<string>("")
  const [bosses, setBosses] = useState<Boss[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadBosses = async () => {
      const { data, error } = await supabase.from("bosses").select("*").order("name")

      if (data && data.length > 0) {
        setBosses(data)
        setSelectedBoss(data[0].id) // Select first boss by default
      }
    }

    loadBosses()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Farm Statistics Tracker</h1>
            <p className="text-muted-foreground">Track your daily boss runs, loot, and earnings</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {user.email}</span>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {bosses.length > 0 && (
          <>
            <div className="mb-6">
              <BossSelector selectedBoss={selectedBoss} onBossChange={setSelectedBoss} bosses={bosses} />
            </div>

            <FarmDashboard selectedBoss={selectedBoss} userId={user.id} />
          </>
        )}
      </div>
    </div>
  )
}
