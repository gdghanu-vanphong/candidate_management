import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Candidate } from "@/type.db"
import DashboardHeader from "@/components/dashboard/DashboardHeader"
import CandidateTable from "@/components/dashboard/CandidateTable"
import AddCandidateDialog from "@/components/dashboard/AddCandidateDialog"

export default function Dashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([])

  useEffect(() => {
    const fetchCandidates = async () => {
      const { data } = await supabase
        .from("candidates")
        .select("*")
        .order("created_at", { ascending: false })

      setCandidates((data ?? []) as Candidate[])
    }

    fetchCandidates()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader />

      <AddCandidateDialog/>

      <CandidateTable
        candidates={candidates}
        onUpdated={(updated) =>
          setCandidates((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
          )
        }
      />
    </div>
  )
}
