"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, BellOff } from "lucide-react"

export function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!isSupported) return

    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === "granted") {
        // Subscribe to push notifications
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""),
        })

        // Send subscription to server
        await fetch("/api/push-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        })

        // Show test notification
        new Notification("Notifications Enabled!", {
          body: "You'll now receive alerts for expiring equipment",
          icon: "/icon-192.jpg",
        })
      }
    } catch (error) {
      console.error("[v0] Error requesting notification permission:", error)
    }
  }

  if (!isSupported) {
    return null
  }

  if (permission === "granted") {
    return (
      <Card className="border-green-500/50">
        <CardContent className="p-4 flex items-center gap-3">
          <Bell className="h-5 w-5 text-green-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">Notifications Enabled</p>
            <p className="text-xs text-muted-foreground">You'll receive alerts for expiring equipment</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (permission === "denied") {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-4 flex items-center gap-3">
          <BellOff className="h-5 w-5 text-destructive" />
          <div className="flex-1">
            <p className="text-sm font-medium">Notifications Blocked</p>
            <p className="text-xs text-muted-foreground">Enable notifications in your browser settings</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Enable Notifications
        </CardTitle>
        <CardDescription>Get alerts when your equipment is about to expire</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={requestPermission} className="w-full">
          Enable Push Notifications
        </Button>
      </CardContent>
    </Card>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
