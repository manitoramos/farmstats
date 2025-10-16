"use client"

import type React from "react"
import { NotificationPermission } from "@/components/notification-permission"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertCircle, Bell, Plus, Trash2, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Equipment {
  id: string
  name: string
  description: string | null
  expiration_date: string
  notification_sent: boolean
  created_at: string
}

interface EquipmentAlertsProps {
  userId: string
  userEmail: string
}

export function EquipmentAlerts({ userId, userEmail }: EquipmentAlertsProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    expiration_date: "",
  })

  useEffect(() => {
    loadEquipment()
  }, [userId])

  const loadEquipment = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/equipment?userId=${userId}`)
      if (!response.ok) throw new Error("Failed to load equipment")
      const data = await response.json()
      setEquipment(data.equipment || [])
    } catch (error) {
      console.error("[v0] Error loading equipment:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId,
        }),
      })

      if (!response.ok) throw new Error("Failed to add equipment")

      setFormData({ name: "", description: "", expiration_date: "" })
      setIsDialogOpen(false)
      await loadEquipment()
    } catch (error) {
      console.error("[v0] Error adding equipment:", error)
      alert("Failed to add equipment. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this equipment?")) return

    try {
      const response = await fetch(`/api/equipment?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete equipment")
      await loadEquipment()
    } catch (error) {
      console.error("[v0] Error deleting equipment:", error)
      alert("Failed to delete equipment. Please try again.")
    }
  }

  const getDaysUntilExpiration = (expirationDate: string) => {
    const today = new Date()
    const expiration = new Date(expirationDate)
    const diffTime = expiration.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getAlertLevel = (daysUntil: number) => {
    if (daysUntil < 0) return "expired"
    if (daysUntil <= 1) return "critical"
    if (daysUntil <= 2) return "warning"
    if (daysUntil <= 3) return "info"
    return "normal"
  }

  const getAlertBadge = (daysUntil: number) => {
    const level = getAlertLevel(daysUntil)

    if (level === "expired") {
      return <Badge variant="destructive">Expired</Badge>
    }
    if (level === "critical") {
      return (
        <Badge variant="destructive">
          Expires in {daysUntil} day{daysUntil !== 1 ? "s" : ""}
        </Badge>
      )
    }
    if (level === "warning") {
      return <Badge className="bg-orange-500 hover:bg-orange-600">Expires in {daysUntil} days</Badge>
    }
    if (level === "info") {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Expires in {daysUntil} days</Badge>
    }
    return <Badge variant="secondary">Expires in {daysUntil} days</Badge>
  }

  const expiringEquipment = equipment.filter((item) => {
    const daysUntil = getDaysUntilExpiration(item.expiration_date)
    return daysUntil <= 3
  })

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
    <div className="space-y-6">
      <NotificationPermission />

      {expiringEquipment.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {expiringEquipment.length} equipment item{expiringEquipment.length !== 1 ? "s" : ""} expiring
            within 3 days!
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Equipment Alerts
              </CardTitle>
              <CardDescription>Track equipment expiration dates and receive notifications</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Equipment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Equipment</DialogTitle>
                  <DialogDescription>Add equipment to track its expiration date</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Equipment Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Dragon Armor"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Additional details about this equipment"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiration_date">Expiration Date</Label>
                    <Input
                      id="expiration_date"
                      type="date"
                      value={formData.expiration_date}
                      onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Equipment"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {equipment.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No equipment tracked yet</p>
              <p className="text-sm">Add equipment to receive expiration alerts</p>
            </div>
          ) : (
            <div className="space-y-4">
              {equipment.map((item) => {
                const daysUntil = getDaysUntilExpiration(item.expiration_date)
                const alertLevel = getAlertLevel(daysUntil)

                return (
                  <Card
                    key={item.id}
                    className={`${
                      alertLevel === "expired" || alertLevel === "critical"
                        ? "border-destructive"
                        : alertLevel === "warning"
                          ? "border-orange-500"
                          : alertLevel === "info"
                            ? "border-yellow-500"
                            : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{item.name}</h3>
                            {getAlertBadge(daysUntil)}
                          </div>
                          {item.description && <p className="text-sm text-muted-foreground mb-2">{item.description}</p>}
                          <p className="text-sm text-muted-foreground">
                            Expires: {new Date(item.expiration_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
