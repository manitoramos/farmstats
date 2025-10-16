import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Get today's date and 3 days from now
    const today = new Date()
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(today.getDate() + 3)

    const todayStr = today.toISOString().split("T")[0]
    const threeDaysStr = threeDaysFromNow.toISOString().split("T")[0]

    // Find equipment expiring within 3 days that hasn't been notified yet
    const { data: expiringEquipment, error } = await supabase
      .from("equipment")
      .select(
        `
        *,
        user:user_id (
          email
        )
      `,
      )
      .gte("expiration_date", todayStr)
      .lte("expiration_date", threeDaysStr)
      .eq("notification_sent", false)

    if (error) throw error

    if (!expiringEquipment || expiringEquipment.length === 0) {
      return NextResponse.json({ message: "No equipment expiring soon", count: 0 })
    }

    // Group equipment by user
    const equipmentByUser = expiringEquipment.reduce(
      (acc, item) => {
        const userEmail = (item.user as any)?.email
        if (!userEmail) return acc

        if (!acc[userEmail]) {
          acc[userEmail] = []
        }
        acc[userEmail].push(item)
        return acc
      },
      {} as Record<string, any[]>,
    )

    // Send emails to each user
    const emailPromises = Object.entries(equipmentByUser).map(async ([email, items]) => {
      try {
        // Send email notification
        await sendEquipmentExpirationEmail(email, items)

        // Mark equipment as notified
        const equipmentIds = items.map((item) => item.id)
        await supabase.from("equipment").update({ notification_sent: true }).in("id", equipmentIds)

        return { email, success: true, count: items.length }
      } catch (error) {
        console.error(`[v0] Failed to send email to ${email}:`, error)
        return { email, success: false, error: String(error) }
      }
    })

    const results = await Promise.all(emailPromises)

    return NextResponse.json({
      message: "Equipment expiration check completed",
      results,
      totalNotifications: results.filter((r) => r.success).length,
    })
  } catch (error) {
    console.error("[v0] Error checking equipment expiration:", error)
    return NextResponse.json({ error: "Failed to check equipment expiration" }, { status: 500 })
  }
}

async function sendEquipmentExpirationEmail(email: string, equipment: any[]) {
  // Calculate days until expiration for each item
  const today = new Date()
  const itemsWithDays = equipment.map((item) => {
    const expirationDate = new Date(item.expiration_date)
    const diffTime = expirationDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return { ...item, daysUntil: diffDays }
  })

  // Sort by days until expiration
  itemsWithDays.sort((a, b) => a.daysUntil - b.daysUntil)

  // Create email content
  const equipmentList = itemsWithDays
    .map((item) => {
      const urgency = item.daysUntil <= 1 ? "🔴 URGENT" : item.daysUntil === 2 ? "🟠 WARNING" : "🟡 NOTICE"
      return `${urgency} - ${item.name} expires in ${item.daysUntil} day${item.daysUntil !== 1 ? "s" : ""} (${new Date(item.expiration_date).toLocaleDateString()})`
    })
    .join("\n")

  const emailBody = `
Hello,

You have ${equipment.length} equipment item${equipment.length !== 1 ? "s" : ""} expiring soon:

${equipmentList}

Please log in to your Farm Statistics Tracker to review and manage your equipment.

Best regards,
Farm Statistics Tracker Team
  `.trim()

  console.log(`[v0] Email notification for ${email}:`)
  console.log(emailBody)
  console.log("---")

  // Note: In production, you would integrate with an email service like:
  // - Resend (https://resend.com)
  // - SendGrid
  // - AWS SES
  // - Postmark
  //
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await resend.emails.send({
  //   from: 'Farm Tracker <notifications@yourdomain.com>',
  //   to: email,
  //   subject: `Equipment Expiration Alert - ${equipment.length} item${equipment.length !== 1 ? 's' : ''} expiring soon`,
  //   text: emailBody,
  // })

  // For now, we'll just log the email content
  // You can set up a real email service by adding the appropriate environment variables
  // and uncommenting the email sending code above
}
