"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Save, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LootItem {
  name: string
  quantity: number
  price: number
}

interface FarmEntryFormProps {
  selectedDate: string
  selectedBoss: string
  bossId: string
  onClose: () => void
  onSave: () => void
}

interface FarmRunData {
  date: string
  boss: string
  kills: number
  chests: number
  timeSpent: number
  loot: LootItem[]
  notes: string
  totalEarnings: number
}

export function FarmEntryForm({ selectedDate, selectedBoss, bossId, onClose, onSave }: FarmEntryFormProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<FarmRunData>({
    date: selectedDate,
    boss: selectedBoss,
    kills: 0,
    chests: 0,
    timeSpent: 0,
    loot: [],
    notes: "",
    totalEarnings: 0,
  })

  const [newLootItem, setNewLootItem] = useState<LootItem>({
    name: "",
    quantity: 1,
    price: 0,
  })

  const addLootItem = () => {
    if (newLootItem.name.trim()) {
      setFormData((prev) => ({
        ...prev,
        loot: [...prev.loot, { ...newLootItem }],
        totalEarnings: prev.totalEarnings + newLootItem.quantity * newLootItem.price,
      }))
      setNewLootItem({ name: "", quantity: 1, price: 0 })
    }
  }

  const removeLootItem = (index: number) => {
    const item = formData.loot[index]
    setFormData((prev) => ({
      ...prev,
      loot: prev.loot.filter((_, i) => i !== index),
      totalEarnings: prev.totalEarnings - item.quantity * item.price,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch("/api/farm-runs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bossId,
          date: formData.date,
          kills: formData.kills,
          chests: formData.chests,
          timeSpent: formData.timeSpent,
          totalEarnings: formData.totalEarnings,
          notes: formData.notes,
          loot: formData.loot,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save farm run")
      }

      toast({
        title: "Success!",
        description: "Farm run saved successfully",
      })

      onSave()
      onClose()
    } catch (error) {
      console.error("[v0] Error saving farm run:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save farm run",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const commonLootItems = [
    { name: "Dragon Scale", price: 5 },
    { name: "Hydra Fang", price: 8 },
    { name: "Mystic Orb", price: 15 },
    { name: "Fire Essence", price: 3 },
    { name: "Magic Crystal", price: 12 },
  ]

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Farm Run Entry - {selectedDate}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground capitalize">Boss: {selectedBoss}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="kills">Kills</Label>
                <Input
                  id="kills"
                  type="number"
                  min="0"
                  value={formData.kills}
                  onChange={(e) => setFormData((prev) => ({ ...prev, kills: Number.parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="chests">Chests</Label>
                <Input
                  id="chests"
                  type="number"
                  min="0"
                  value={formData.chests}
                  onChange={(e) => setFormData((prev) => ({ ...prev, chests: Number.parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="timeSpent">Time Spent (minutes)</Label>
                <Input
                  id="timeSpent"
                  type="number"
                  min="0"
                  value={formData.timeSpent}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, timeSpent: Number.parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            {/* Loot Section */}
            <div>
              <Label className="text-base font-semibold">Loot Collected</Label>
              <div className="mt-2 space-y-3">
                {/* Quick Add Common Items */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Quick Add:</p>
                  <div className="flex flex-wrap gap-2">
                    {commonLootItems.map((item) => (
                      <Button
                        key={item.name}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setNewLootItem((prev) => ({ ...prev, name: item.name, price: item.price }))}
                      >
                        {item.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Add New Loot Item */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <Input
                    placeholder="Item name"
                    value={newLootItem.name}
                    onChange={(e) => setNewLootItem((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Quantity"
                    min="1"
                    value={newLootItem.quantity}
                    onChange={(e) =>
                      setNewLootItem((prev) => ({
                        ...prev,
                        quantity: Number.parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Price each"
                    min="0"
                    step="0.01"
                    value={newLootItem.price}
                    onChange={(e) =>
                      setNewLootItem((prev) => ({
                        ...prev,
                        price: Number.parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                  <Button type="button" onClick={addLootItem}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Current Loot Items */}
                {formData.loot.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Added Items:</p>
                    {formData.loot.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{item.name}</span>
                          <Badge variant="secondary">x{item.quantity}</Badge>
                          <span className="text-muted-foreground">
                            @ {item.price} each = {(item.quantity * item.price).toFixed(2)}
                          </span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeLootItem(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Total Earnings Display */}
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Earnings:</span>
                <span className="text-2xl font-bold text-primary">{formData.totalEarnings.toFixed(2)}</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes about this farm run..."
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Farm Run
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
