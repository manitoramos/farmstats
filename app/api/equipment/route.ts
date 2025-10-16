import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { data: equipment, error } = await supabase
      .from("equipment")
      .select("*")
      .eq("user_id", userId)
      .order("expiration_date", { ascending: true })

    if (error) throw error

    return NextResponse.json({ equipment })
  } catch (error) {
    console.error("[v0] Error fetching equipment:", error)
    return NextResponse.json({ error: "Failed to fetch equipment" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { userId, name, description, expiration_date } = body

    if (!userId || !name || !expiration_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("equipment")
      .insert({
        user_id: userId,
        name,
        description: description || null,
        expiration_date,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ equipment: data })
  } catch (error) {
    console.error("[v0] Error creating equipment:", error)
    return NextResponse.json({ error: "Failed to create equipment" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Equipment ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("equipment").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting equipment:", error)
    return NextResponse.json({ error: "Failed to delete equipment" }, { status: 500 })
  }
}
