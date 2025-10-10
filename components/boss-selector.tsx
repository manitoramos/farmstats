"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Boss } from "@/lib/types"

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Easy":
      return "bg-secondary text-secondary-foreground"
    case "Medium":
      return "bg-chart-3 text-foreground"
    case "Hard":
      return "bg-chart-1 text-foreground"
    case "Extreme":
      return "bg-destructive text-destructive-foreground"
    default:
      return "bg-muted text-muted-foreground"
  }
}

interface BossSelectorProps {
  selectedBoss: string
  onBossChange: (bossId: string) => void
  bosses: Boss[]
}

export function BossSelector({ selectedBoss, onBossChange, bosses }: BossSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Select Boss</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bosses.map((boss) => (
            <div
              key={boss.id}
              className={`relative cursor-pointer transition-all duration-200 ${
                selectedBoss === boss.id ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-muted-foreground"
              }`}
              onClick={() => onBossChange(boss.id)}
            >
              <Card className={`h-full ${selectedBoss === boss.id ? "bg-accent/10" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <img
                      src={boss.image_url || "/placeholder.svg"}
                      alt={boss.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-lg">{boss.name}</h3>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <Badge className={getDifficultyColor("Hard")}>Hard</Badge>
                        <span className="text-sm text-muted-foreground">15-20 min</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium mb-1">Boss Description:</p>
                      <p>{boss.description || "A powerful boss"}</p>
                    </div>
                    {selectedBoss === boss.id && (
                      <Button size="sm" className="w-full">
                        Selected
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
