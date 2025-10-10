import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-100">Thank you for signing up!</CardTitle>
              <CardDescription className="text-slate-400">Check your email to confirm</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300">
                You&apos;ve successfully signed up for the farm tracker. Please check your email to confirm your account
                before signing in.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
