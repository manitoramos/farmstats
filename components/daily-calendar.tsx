"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

interface DayData {
  date: string
  kills: number
  chests: number
  earnings: number
  completed: boolean
}

interface DailyCalendarProps {
  selectedBoss: string
  userId: string
  onDaySelect: (date: string) => void
}

export function DailyCalendar({ selectedBoss, userId, onDaySelect }: DailyCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [calendarData, setCalendarData] = useState<Record<string, DayData>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFarmRuns = async () => {
      setIsLoading(true)
      try {
        const startDate = `${currentYear}-${currentMonth.toString().padStart(2, "0")}-01`
        const lastDay = new Date(currentYear, currentMonth, 0).getDate()
        const endDate = `${currentYear}-${currentMonth.toString().padStart(2, "0")}-${lastDay}`

        const response = await fetch(`/api/farm-runs?bossId=${selectedBoss}&startDate=${startDate}&endDate=${endDate}`)

        if (!response.ok) throw new Error("Failed to load farm runs")

        const data = await response.json()
        const farmRuns = data.farmRuns || []

        const newCalendarData: Record<string, DayData> = {}
        farmRuns.forEach((run: any) => {
          const dateObj = new Date(run.date)
          const dateKey = `${dateObj.getDate().toString().padStart(2, "0")}/${(dateObj.getMonth() + 1).toString().padStart(2, "0")}/${dateObj.getFullYear()}`

          if (newCalendarData[dateKey]) {
            // Aggregate with existing data for this day
            newCalendarData[dateKey].kills += run.kills
            newCalendarData[dateKey].chests += run.chests
            newCalendarData[dateKey].earnings += run.total_earnings
          } else {
            // First run for this day
            newCalendarData[dateKey] = {
              date: dateKey,
              kills: run.kills,
              chests: run.chests,
              earnings: run.total_earnings,
              completed: true,
            }
          }
        })

        setCalendarData(newCalendarData)
      } catch (error) {
        console.error("[v0] Error loading farm runs:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (selectedBoss && userId) {
      loadFarmRuns()
    }
  }, [selectedBoss, userId, currentMonth, currentYear])

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month - 1, 1).getDay()
  }

  const formatDate = (day: number, month: number, year: number) => {
    return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`
  }

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (currentMonth === 1) {
        setCurrentMonth(12)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 border border-border/50"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDate(day, currentMonth, currentYear)
      const dayData = calendarData[dateKey]
      const isToday =
        new Date().getDate() === day &&
        new Date().getMonth() + 1 === currentMonth &&
        new Date().getFullYear() === currentYear

      days.push(
        <div
          key={day}
          className={`h-20 border border-border/50 p-1 cursor-pointer transition-all duration-200 hover:bg-accent/10 ${
            isToday ? "ring-2 ring-primary" : ""
          } ${dayData?.completed ? "bg-secondary/20" : ""}`}
          onClick={() => onDaySelect(dateKey)}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>{day}</span>
              {dayData?.completed && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  ✓
                </Badge>
              )}
            </div>
            {dayData && dayData.completed && (
              <div className="flex-1 text-xs text-muted-foreground mt-1">
                <div>K: {dayData.kills}</div>
                <div>C: {dayData.chests}</div>
                <div>E: {dayData.earnings.toFixed(1)}</div>
              </div>
            )}
          </div>
        </div>,
      )
    }

    return days
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Daily Farm Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[140px] text-center">
              {monthNames[currentMonth - 1]} {currentYear}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-0 mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="h-8 flex items-center justify-center font-medium text-muted-foreground border border-border/50"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0">{renderCalendarDays()}</div>
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-secondary/20 rounded"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-border rounded"></div>
              <span>Pending</span>
            </div>
          </div>
          <div className="text-xs">K: Kills | C: Chests | E: Earnings</div>
        </div>
      </CardContent>
    </Card>
  )
}
