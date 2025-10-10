import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FarmTrackerClient } from "@/components/farm-tracker-client"

export default async function FarmTracker() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return <FarmTrackerClient user={data.user} />
}
