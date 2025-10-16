import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subscription = await request.json()

    // Store the push subscription in the database
    // You would need to create a push_subscriptions table for this
    // For now, we'll just log it
    console.log("[v0] Push subscription received for user:", user.id)
    console.log("[v0] Subscription:", JSON.stringify(subscription, null, 2))

    // In production, you would:
    // 1. Create a push_subscriptions table
    // 2. Store the subscription with the user_id
    // 3. Use web-push library to send notifications

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving push subscription:", error)
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 })
  }
}
