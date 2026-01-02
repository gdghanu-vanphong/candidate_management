import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export default function DashboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Candidate Dashboard</h1>

      <Button
        variant="outline"
        onClick={() => supabase.auth.signOut()}
      >
        Logout
      </Button>
    </div>
  )
}
