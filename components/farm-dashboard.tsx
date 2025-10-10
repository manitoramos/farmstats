"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, TrendingUp, Coins, Package } from "lucide-react"
import { DailyCalendar } from "./daily-calendar"
import { FarmEntryForm } from "./farm-entry-form"
import { StatisticsDashboard } from "./statistics-dashboard"
import { PricingManagement } from "./pricing-management"
import type { FarmStats } from "@/lib/types"

interface FarmDashboardProps {
  selectedBoss: string
  userId: string
}

interface FarmRunData {
  date: string
  boss: string
  kills: number
  chests: number
  timeSpent: number
  loot: Array<{ name: string; quantity: number; price: number }>
  notes: string
  totalEarnings: number
}

async function fetchFarmStats(userId: string, bossId?: string, year?: number, month?: number): Promise<FarmStats> {
  const params = new URLSearchParams({
    userId,
    ...(bossId && { bossId }),
    ...(year && { year: year.toString() }),
    ...(month && { month: month.toString() }),
  })

  const response = await fetch(`/api/farm-stats?${params}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch farm stats: ${response.statusText}`)
  }

  return response.json()
}

export function FarmDashboard({ selectedBoss, userId }: FarmDashboardProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [stats, setStats] = useState<FarmStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        const currentDate = new Date()
        const farmStats = await fetchFarmStats(
          userId,
          selectedBoss,
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
        )
        setStats(farmStats)
      } catch (error) {
        console.error("Error loading farm stats:", error)
      } finally {
        setLoading(false)
      }
    }

    if (selectedBoss && userId) {
      loadStats()
    }
  }, [selectedBoss, userId])

  const handleDaySelect = (date: string) => {
    setSelectedDate(date)
    setShowEntryForm(true)
  }

  const handleSaveFarmRun = async (farmRunData: FarmRunData) => {
    console.log("Saving farm run data:", farmRunData)
    try {
      const currentDate = new Date()
      const farmStats = await fetchFarmStats(
        userId,
        selectedBoss,
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
      )
      setStats(farmStats)
    } catch (error) {
      console.error("Error refreshing stats:", error)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  const statCards = [
    {
      title: "Total Days",
      value: stats?.totalDays || 0,
      icon: CalendarDays,
      color: "text-chart-2",
    },
    {
      title: "Total Kills",
      value: stats?.totalKills || 0,
      icon: TrendingUp,
      color: "text-chart-1",
    },
    {
      title: "Total Chests",
      value: stats?.totalChests || 0,
      icon: Package,
      color: "text-chart-3",
    },
    {
      title: "Total Earnings",
      value: `${(stats?.totalEarnings || 0).toFixed(2)}`,
      icon: Coins,
      color: "text-chart-4",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">Calendar & Entry</TabsTrigger>
          <TabsTrigger value="statistics">Statistics & Analytics</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Management</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <DailyCalendar selectedBoss={selectedBoss} userId={userId} onDaySelect={handleDaySelect} />

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Average Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Kills/Day:</span>
                    <span className="font-medium">{(stats?.averageKillsPerDay || 0).toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Earnings/Day:</span>
                    <span className="font-medium">{(stats?.averageEarningsPerDay || 0).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Period</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Year:</span>
                    <span className="font-medium">{new Date().getFullYear()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Month:</span>
                    <span className="font-medium">{new Date().getMonth() + 1}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Best Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Best Day:</span>
                    <span className="font-medium text-chart-1">{stats?.bestDay.date || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Best Earnings:</span>
                    <span className="font-medium">{(stats?.bestDay.earnings || 0).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Boss Image Display */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg capitalize">{selectedBoss} Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <img
                  src="/blue-dragon-head-boss-hidras.jpg"
                  alt={selectedBoss}
                  className="w-48 h-48 rounded-lg object-cover"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics">
          <StatisticsDashboard selectedBoss={selectedBoss} userId={userId} />
        </TabsContent>

        <TabsContent value="pricing">
          <PricingManagement selectedBoss={selectedBoss} bossId={selectedBoss} />
        </TabsContent>
      </Tabs>

      {showEntryForm && selectedDate && (
        <FarmEntryForm
          selectedDate={selectedDate}
          selectedBoss={selectedBoss}
          bossId={selectedBoss}
          onClose={() => setShowEntryForm(false)}
          onSave={handleSaveFarmRun}
        />
      )}
    </div>
  )
}
