import { useEffect, useMemo, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { MoreHorizontal, CalendarIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format, isAfter, isBefore, parseISO } from "date-fns"
import { cn } from "@/lib/utils"

type Candidate = {
  id: string
  full_name: string
  applied_position: string
  status: string | null
  resume_url: string | null
  created_at: string 
}

const STATUS_FLOW = ["New", "Interviewing", "Hired", "Rejected"] as const

export default function CandidatesTable() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [searchName, setSearchName] = useState("")
  const [searchPosition, setSearchPosition] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined)
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)

  useEffect(() => {
    supabase
      .from("candidates")
      .select("id, full_name, applied_position, status, resume_url, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setCandidates(data ?? []))

    // Realtime subscription
    const channel = supabase
      .channel("realtime:candidates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "candidates" },
        (payload) => {
          setCandidates((prev) => {
            switch (payload.eventType) {
              case "INSERT":
                return [payload.new as Candidate, ...prev]
              case "UPDATE":
                return prev.map((c) =>
                  c.id === payload.new.id ? (payload.new as Candidate) : c
                )
              case "DELETE":
                return prev.filter((c) => c.id !== payload.old.id)
              default:
                return prev
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const updateStatus = async (id: string, newStatus: string) => {
    await supabase
      .from("candidates")
      .update({ status: newStatus })
      .eq("id", id)
  }

  const deleteCandidate = async () => {
    if (!deleteId) return
    await supabase.from("candidates").delete().eq("id", deleteId)
    setDeleteId(null)
    setIsDeleteOpen(false)
  }

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const nameMatch = c.full_name.toLowerCase().includes(searchName.toLowerCase())
      const positionMatch = c.applied_position.toLowerCase().includes(searchPosition.toLowerCase())
      const statusMatch = selectedStatus ? (c.status ?? "New") === selectedStatus : true
      const createdDate = parseISO(c.created_at)
      const fromMatch = dateFrom ? isAfter(createdDate, dateFrom) || createdDate.toDateString() === dateFrom.toDateString() : true
      const toMatch = dateTo ? isBefore(createdDate, dateTo) || createdDate.toDateString() === dateTo.toDateString() : true

      return nameMatch && positionMatch && statusMatch && fromMatch && toMatch
    }).sort((a, b) => {
      const aNameScore = Math.abs(a.full_name.length - searchName.length)
      const bNameScore = Math.abs(b.full_name.length - searchName.length)
      return aNameScore - bNameScore
    })
  }, [candidates, searchName, searchPosition, selectedStatus, dateFrom, dateTo])

  return (
    <>
      <div className="flex flex-wrap gap-4 mb-4">
        <Input
          placeholder="Search by name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="max-w-xs"
        />
        <Input
          placeholder="Search by position"
          value={searchPosition}
          onChange={(e) => setSearchPosition(e.target.value)}
          className="max-w-xs"
        />
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Interviewing">Interviewing</SelectItem>
            <SelectItem value="Hired">Hired</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "max-w-xs justify-between",
                !dateFrom && "text-muted-foreground"
              )}
            >
              {dateFrom ? format(dateFrom, "PPP") : <span>From date</span>}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={setDateFrom}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "max-w-xs justify-between",
                !dateTo && "text-muted-foreground"
              )}
            >
              {dateTo ? format(dateTo, "PPP") : <span>To date</span>}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={setDateTo}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">Full Name</TableHead>
            <TableHead className="text-center">Applied Position</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">CV</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCandidates.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.full_name}</TableCell>
              <TableCell>{c.applied_position}</TableCell>
              <TableCell>{c.status ?? "New"}</TableCell>
              <TableCell>
                {c.resume_url ? (
                  <a
                    href={c.resume_url}
                    target="_blank"
                    className="text-blue-600 underline"
                  >
                    View CV
                  </a>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {STATUS_FLOW.map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => updateStatus(c.id, status)}
                      >
                        Set to {status}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        setDeleteId(c.id)
                        setIsDeleteOpen(true)
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog (moved outside for better handling) */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this candidate?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={deleteCandidate}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}