import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// This endpoint can be called manually or set up as a cron job
export async function POST() {
  try {
    const supabase = await createServerClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get today's date and 3 days from now
    const today = new Date()
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(today.getDate() + 3)

    const todayStr = today.toISOString().split("T")[0]
    const threeDaysStr = threeDaysFromNow.toISOString().split("T")[0]

    // Find user's equipment expiring within 3 days
    const { data: expiringEquipment, error } = await supabase
      .from("equipment")
      .select("*")
      .eq("user_id", user.id)
      .gte("expiration_date", todayStr)
      .lte("expiration_date", threeDaysStr)

    if (error) throw error

    return NextResponse.json({
      count: expiringEquipment?.length || 0,
      equipment: expiringEquipment || [],
    })
  } catch (error) {
    console.error("[v0] Error checking notifications:", error)
    return NextResponse.json({ error: "Failed to check notifications" }, { status: 500 })
  }
}
