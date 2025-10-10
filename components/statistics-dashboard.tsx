"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, TrendingDown, Target, Clock, Award, Zap, Loader2 } from "lucide-react"

interface StatisticsDashboardProps {
  selectedBoss: string
  userId: string
}

export function StatisticsDashboard({ selectedBoss, userId }: StatisticsDashboardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [farmRuns, setFarmRuns] = useState<any[]>([])
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [lootDistribution, setLootDistribution] = useState<any[]>([])

  useEffect(() => {
    const loadStatistics = async () => {
      setIsLoading(true)
      try {
        // Get last 30 days of data
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)

        const response = await fetch(
          `/api/farm-runs?bossId=${selectedBoss}&startDate=${startDate.toISOString().split("T")[0]}&endDate=${endDate.toISOString().split("T")[0]}`,
        )

        if (!response.ok) throw new Error("Failed to load statistics")

        const data = await response.json()
        const runs = data.farmRuns || []
        setFarmRuns(runs)

        // Process weekly data (last 7 days)
        const last7Days = runs.slice(0, 7).reverse()
        const processedWeeklyData = last7Days.map((run: any) => {
          const date = new Date(run.date)
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
          return {
            day: dayNames[date.getDay()],
            kills: run.kills,
            earnings: run.total_earnings,
            efficiency: run.time_spent > 0 ? Math.min(100, (run.kills / run.time_spent) * 100) : 0,
          }
        })
        setWeeklyData(processedWeeklyData)

        // Process loot distribution
        const lootCounts: Record<string, number> = {}
        runs.forEach((run: any) => {
          if (run.loot && Array.isArray(run.loot)) {
            run.loot.forEach((item: any) => {
              const itemName = item.loot_item?.name || "Unknown"
              lootCounts[itemName] = (lootCounts[itemName] || 0) + item.quantity
            })
          }
        })

        const colors = ["#6366f1", "#ec4899", "#84cc16", "#fbbf24", "#9333ea", "#06b6d4", "#f97316"]
        const processedLootDistribution = Object.entries(lootCounts)
          .map(([name, value], index) => ({
            name,
            value,
            color: colors[index % colors.length],
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 7)

        setLootDistribution(processedLootDistribution)
      } catch (error) {
        console.error("[v0] Error loading statistics:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (selectedBoss && userId) {
      loadStatistics()
    }
  }, [selectedBoss, userId])

  const calculateStats = () => {
    if (farmRuns.length === 0) {
      return {
        currentStreak: 0,
        totalHours: 0,
        averageSessionTime: 0,
        averageEfficiency: 0,
        personalBests: {
          mostKills: { value: 0, date: "N/A" },
          highestEarnings: { value: 0, date: "N/A" },
          fastestRun: { value: 0, date: "N/A" },
          bestEfficiency: { value: 0, date: "N/A" },
        },
      }
    }

    // Calculate current streak
    let currentStreak = 0
    const sortedRuns = [...farmRuns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < sortedRuns.length; i++) {
      const runDate = new Date(sortedRuns[i].date)
      runDate.setHours(0, 0, 0, 0)
      const expectedDate = new Date(today)
      expectedDate.setDate(expectedDate.getDate() - i)

      if (runDate.getTime() === expectedDate.getTime()) {
        currentStreak++
      } else {
        break
      }
    }

    // Calculate total hours and average session time
    const totalMinutes = farmRuns.reduce((sum, run) => sum + (run.time_spent || 0), 0)
    const totalHours = totalMinutes / 60
    const averageSessionTime = farmRuns.length > 0 ? totalMinutes / farmRuns.length : 0

    // Calculate average efficiency
    const efficiencies = farmRuns.filter((run) => run.time_spent > 0).map((run) => (run.kills / run.time_spent) * 100)
    const averageEfficiency =
      efficiencies.length > 0 ? efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length : 0

    // Find personal bests
    const mostKillsRun = farmRuns.reduce((max, run) => (run.kills > max.kills ? run : max), farmRuns[0])
    const highestEarningsRun = farmRuns.reduce(
      (max, run) => (run.total_earnings > max.total_earnings ? run : max),
      farmRuns[0],
    )
    const fastestRun = farmRuns
      .filter((run) => run.time_spent > 0)
      .reduce(
        (min, run) => (run.time_spent < min.time_spent ? run : min),
        farmRuns.find((r) => r.time_spent > 0) || farmRuns[0],
      )
    const bestEfficiencyRun = farmRuns
      .filter((run) => run.time_spent > 0)
      .reduce(
        (max, run) => {
          const maxEff = max.time_spent > 0 ? max.kills / max.time_spent : 0
          const runEff = run.kills / run.time_spent
          return runEff > maxEff ? run : max
        },
        farmRuns.find((r) => r.time_spent > 0) || farmRuns[0],
      )

    return {
      currentStreak,
      totalHours,
      averageSessionTime,
      averageEfficiency,
      personalBests: {
        mostKills: {
          value: mostKillsRun?.kills || 0,
          date: mostKillsRun?.date ? new Date(mostKillsRun.date).toLocaleDateString() : "N/A",
        },
        highestEarnings: {
          value: highestEarningsRun?.total_earnings || 0,
          date: highestEarningsRun?.date ? new Date(highestEarningsRun.date).toLocaleDateString() : "N/A",
        },
        fastestRun: {
          value: fastestRun?.time_spent || 0,
          date: fastestRun?.date ? new Date(fastestRun.date).toLocaleDateString() : "N/A",
        },
        bestEfficiency: {
          value: bestEfficiencyRun?.time_spent > 0 ? (bestEfficiencyRun.kills / bestEfficiencyRun.time_spent) * 100 : 0,
          date: bestEfficiencyRun?.date ? new Date(bestEfficiencyRun.date).toLocaleDateString() : "N/A",
        },
      },
    }
  }

  const stats = calculateStats()

  const achievements = [
    {
      title: "First Kill",
      description: "Defeated your first boss",
      completed: farmRuns.length > 0,
      date: farmRuns.length > 0 ? new Date(farmRuns[farmRuns.length - 1].date).toLocaleDateString() : undefined,
    },
    {
      title: "Speed Runner",
      description: "Complete a run in under 15 minutes",
      completed: farmRuns.some((run) => run.time_spent > 0 && run.time_spent < 15),
      progress: farmRuns.length > 0 ? Math.min(100, (15 / (stats.averageSessionTime || 15)) * 100) : 0,
    },
    {
      title: "Loot Master",
      description: "Collect 100 total items",
      completed: false,
      progress: Math.min(
        100,
        farmRuns.reduce((sum, run) => sum + (run.chests || 0), 0),
      ),
    },
    {
      title: "Consistency",
      description: "Farm for 7 consecutive days",
      completed: stats.currentStreak >= 7,
      progress: Math.min(100, (stats.currentStreak / 7) * 100),
    },
  ]

  const personalBests = [
    {
      metric: "Most Kills (Single Day)",
      value: stats.personalBests.mostKills.value.toString(),
      date: stats.personalBests.mostKills.date,
      trend: "up" as const,
    },
    {
      metric: "Highest Earnings (Single Day)",
      value: stats.personalBests.highestEarnings.value.toFixed(2),
      date: stats.personalBests.highestEarnings.date,
      trend: "up" as const,
    },
    {
      metric: "Fastest Run Time",
      value: `${stats.personalBests.fastestRun.value}m`,
      date: stats.personalBests.fastestRun.date,
      trend: "down" as const,
    },
    {
      metric: "Best Efficiency",
      value: `${stats.personalBests.bestEfficiency.value.toFixed(0)}%`,
      date: stats.personalBests.bestEfficiency.date,
      trend: "up" as const,
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold text-chart-2">{stats.currentStreak} days</p>
              </div>
              <Zap className="h-8 w-8 text-chart-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold text-chart-3">{stats.totalHours.toFixed(1)}h</p>
              </div>
              <Clock className="h-8 w-8 text-chart-3" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Session</p>
                <p className="text-2xl font-bold text-chart-4">{stats.averageSessionTime.toFixed(1)}m</p>
              </div>
              <Target className="h-8 w-8 text-chart-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Efficiency</p>
                <p className="text-2xl font-bold text-chart-1">{stats.averageEfficiency.toFixed(0)}%</p>
              </div>
              <Award className="h-8 w-8 text-chart-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="kills" fill="#6366f1" name="Kills" />
                  <Bar dataKey="earnings" fill="#ec4899" name="Earnings" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loot Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Loot Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {lootDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={lootDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {lootDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No loot data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Personal Bests */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Bests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {personalBests.map((best, index) => (
              <div key={index} className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{best.metric}</h4>
                  {best.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-chart-2" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-chart-1" />
                  )}
                </div>
                <p className="text-2xl font-bold">{best.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{best.date}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {achievements.map((achievement, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{achievement.title}</h4>
                    {achievement.completed && (
                      <Badge variant="secondary" className="bg-chart-2 text-white">
                        Completed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                  {!achievement.completed && achievement.progress !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{achievement.progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={achievement.progress} className="h-2" />
                    </div>
                  )}
                  {achievement.completed && achievement.date && (
                    <p className="text-xs text-muted-foreground">Completed on {achievement.date}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Efficiency Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Efficiency Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="efficiency" stroke="#6366f1" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No efficiency data available yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
