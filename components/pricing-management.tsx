"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Save, X, TrendingUp, DollarSign, History, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LootItem {
  id: string
  name: string
  base_price: number
  rarity: string
  boss_id: string
}

interface PriceHistoryEntry {
  id: string
  price: number
  recorded_at: string
}

interface PricingManagementProps {
  selectedBoss: string
  bossId: string
}

export function PricingManagement({ selectedBoss, bossId }: PricingManagementProps) {
  const { toast } = useToast()
  const [lootItems, setLootItems] = useState<LootItem[]>([])
  const [priceHistory, setPriceHistory] = useState<Record<string, PriceHistoryEntry[]>>({})
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState<number>(0)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadLootItems()
  }, [bossId])

  useEffect(() => {
    if (selectedItemForHistory) {
      loadPriceHistory(selectedItemForHistory)
    }
  }, [selectedItemForHistory])

  const loadLootItems = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/loot-items?bossId=${bossId}`)
      if (!response.ok) throw new Error("Failed to load loot items")

      const data = await response.json()
      setLootItems(data.lootItems || [])

      // Set first item as selected for history
      if (data.lootItems && data.lootItems.length > 0) {
        setSelectedItemForHistory(data.lootItems[0].id)
      }
    } catch (error) {
      console.error("[v0] Error loading loot items:", error)
      toast({
        title: "Error",
        description: "Failed to load loot items",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadPriceHistory = async (itemId: string) => {
    try {
      const response = await fetch(`/api/price-history?lootItemId=${itemId}`)
      if (!response.ok) throw new Error("Failed to load price history")

      const data = await response.json()
      setPriceHistory((prev) => ({
        ...prev,
        [itemId]: data.priceHistory || [],
      }))
    } catch (error) {
      console.error("[v0] Error loading price history:", error)
    }
  }

  const handleEditStart = (item: LootItem) => {
    setEditingItem(item.id)
    setEditPrice(item.base_price)
  }

  const handleEditSave = async (itemId: string) => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/loot-items", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: itemId,
          basePrice: editPrice,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update price")
      }

      // Update local state
      setLootItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                base_price: editPrice,
              }
            : item,
        ),
      )

      // Reload price history for this item
      await loadPriceHistory(itemId)

      toast({
        title: "Success!",
        description: "Price updated successfully",
      })

      setEditingItem(null)
    } catch (error) {
      console.error("[v0] Error updating price:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update price",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditCancel = () => {
    setEditingItem(null)
    setEditPrice(0)
  }

  const getCategoryColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "common":
        return "bg-muted text-muted-foreground"
      case "rare":
        return "bg-chart-4 text-white"
      case "epic":
        return "bg-chart-1 text-white"
      case "legendary":
        return "bg-chart-5 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const calculateStats = () => {
    const totalValue = lootItems.reduce((sum, item) => sum + item.base_price, 0)
    const averagePrice = lootItems.length > 0 ? totalValue / lootItems.length : 0
    return { totalValue, averagePrice }
  }

  const { totalValue, averagePrice } = calculateStats()

  const selectedItem = lootItems.find((item) => item.id === selectedItemForHistory)
  const historyForSelectedItem = priceHistory[selectedItemForHistory] || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Price Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Portfolio Value</p>
                <p className="text-2xl font-bold">{totalValue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-chart-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Item Price</p>
                <p className="text-2xl font-bold">{averagePrice.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-chart-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Items Tracked</p>
                <p className="text-2xl font-bold">{lootItems.length}</p>
              </div>
              <History className="h-8 w-8 text-chart-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">Current Prices</TabsTrigger>
          <TabsTrigger value="history">Price History</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <Card>
            <CardHeader>
              <CardTitle>Item Price Management</CardTitle>
              <p className="text-muted-foreground">Manage and track prices for all your loot items</p>
            </CardHeader>
            <CardContent>
              {lootItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No loot items found for this boss.</p>
                  <p className="text-sm mt-2">Add items by recording farm runs with loot.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Rarity</TableHead>
                      <TableHead>Current Price</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lootItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(item.rarity)}>{item.rarity}</Badge>
                        </TableCell>
                        <TableCell>
                          {editingItem === item.id ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={editPrice}
                              onChange={(e) => setEditPrice(Number.parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          ) : (
                            <span className="font-medium">{item.base_price.toFixed(2)}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingItem === item.id ? (
                            <div className="flex gap-1">
                              <Button size="sm" onClick={() => handleEditSave(item.id)} disabled={isSaving}>
                                {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleEditCancel} disabled={isSaving}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleEditStart(item)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Price History</CardTitle>
              <p className="text-muted-foreground">Track price changes over time</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="item-select">Select Item</Label>
                  <select
                    id="item-select"
                    className="w-full p-2 border border-border rounded-md bg-background"
                    value={selectedItemForHistory}
                    onChange={(e) => setSelectedItemForHistory(e.target.value)}
                  >
                    {lootItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedItem && (
                  <div className="space-y-2">
                    <h4 className="font-medium">{selectedItem.name} Price History</h4>
                    {historyForSelectedItem.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">No price history available yet.</p>
                    ) : (
                      <div className="space-y-1">
                        {historyForSelectedItem.map((entry, index) => {
                          const prevPrice = index > 0 ? historyForSelectedItem[index - 1].price : entry.price
                          const change = entry.price - prevPrice

                          return (
                            <div key={entry.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                              <span className="text-sm">{new Date(entry.recorded_at).toLocaleDateString()}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{entry.price.toFixed(2)}</span>
                                {change !== 0 && (
                                  <Badge
                                    variant={change > 0 ? "default" : "destructive"}
                                    className={change > 0 ? "bg-chart-2" : "bg-chart-1"}
                                  >
                                    {change > 0 ? "+" : ""}
                                    {change.toFixed(2)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
