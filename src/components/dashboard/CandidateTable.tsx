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
import { MoreHorizontal, CalendarIcon, ArrowUpDown } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format, isAfter, isBefore, parseISO, startOfDay, endOfDay } from "date-fns"
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

type SortKey = "full_name" | "applied_position" | "status" | "created_at"

export default function CandidatesTable() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined)
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [sortKey, setSortKey] = useState<SortKey>("created_at")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [currentData, setCurrentData] = useState<Candidate[]>([])
  const [afterCursor, setAfterCursor] = useState<string | null>(null)
  const [beforeCursor, setBeforeCursor] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)
  const pageSize = 10

  useEffect(() => {
    supabase
      .from("candidates")
      .select("id, full_name, applied_position, status, resume_url, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setCandidates(data ?? []))
    
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

  const comparator = (a: Candidate, b: Candidate): number => {
    let aVal: string | number = ""
    let bVal: string | number = ""
    switch (sortKey) {
      case "full_name":
        aVal = a.full_name.toLowerCase()
        bVal = b.full_name.toLowerCase()
        break
      case "applied_position":
        aVal = a.applied_position.toLowerCase()
        bVal = b.applied_position.toLowerCase()
        break
      case "status":
        aVal = (a.status ?? "New").toLowerCase()
        bVal = (b.status ?? "New").toLowerCase()
        break
      case "created_at":
        aVal = parseISO(a.created_at).getTime()
        bVal = parseISO(b.created_at).getTime()
        break
    }
    let cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    if (sortDir === "desc") cmp = -cmp
    if (cmp === 0) {
      return a.id > b.id ? 1 : a.id < b.id ? -1 : 0
    }
    return cmp
  }

  const sortedCandidates = useMemo(() => {
    const filtered = candidates.filter((c) => {
      const termLower = searchTerm.toLowerCase()
      const textMatch =
        !termLower ||
        c.full_name.toLowerCase().includes(termLower) ||
        c.applied_position.toLowerCase().includes(termLower) ||
        (c.status ?? "New").toLowerCase().includes(termLower)
      const statusMatch = selectedStatus ? (c.status ?? "New") === selectedStatus : true
      const createdDate = parseISO(c.created_at)
      const fromMatch = dateFrom
        ? isAfter(createdDate, startOfDay(dateFrom)) ||
          createdDate.getTime() === startOfDay(dateFrom).getTime()
        : true
      const toMatch = dateTo
        ? isBefore(createdDate, endOfDay(dateTo)) ||
          createdDate.getTime() === endOfDay(dateTo).getTime()
        : true
      return textMatch && statusMatch && fromMatch && toMatch
    })
    return [...filtered].sort(comparator)
  }, [candidates, searchTerm, selectedStatus, dateFrom, dateTo, sortKey, sortDir])

  useEffect(() => {
    loadFirstPage()
  }, [sortedCandidates])

  const loadFirstPage = () => {
    const data = sortedCandidates.slice(0, pageSize)
    setCurrentData(data)
    setHasPrev(false)
    setHasNext(data.length === pageSize)
    if (data.length > 0) {
      setBeforeCursor(data[0].id)
      setAfterCursor(data[data.length - 1].id)
    } else {
      setBeforeCursor(null)
      setAfterCursor(null)
    }
  }

  const loadNextPage = () => {
    if (!afterCursor) return
    const cursorIndex = sortedCandidates.findIndex((c) => c.id === afterCursor)
    if (cursorIndex === -1) {
      loadFirstPage() 
      return
    }
    const start = cursorIndex + 1
    const data = sortedCandidates.slice(start, start + pageSize)
    setCurrentData(data)
    setHasNext(data.length === pageSize)
    setHasPrev(true)
    if (data.length > 0) {
      setBeforeCursor(data[0].id)
      setAfterCursor(data[data.length - 1].id)
    }
  }

  const loadPrevPage = () => {
    if (!beforeCursor) return
    const cursorIndex = sortedCandidates.findIndex((c) => c.id === beforeCursor)
    if (cursorIndex === -1) {
      loadFirstPage() 
      return
    }
    const end = cursorIndex
    const start = Math.max(0, end - pageSize)
    const data = sortedCandidates.slice(start, end)
    setCurrentData(data)
    setHasPrev(start > 0)
    setHasNext(true) 
    if (data.length > 0) {
      setBeforeCursor(data[0].id)
      setAfterCursor(data[data.length - 1].id)
    }
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-4 mb-4">
        <Input
          placeholder="Search by name, position, or status"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="text-center cursor-pointer"
              onClick={() => handleSort("full_name")}
            >
              Full Name{" "}
              {sortKey === "full_name" && (
                <ArrowUpDown className="inline-block h-4 w-4" />
              )}
            </TableHead>
            <TableHead
              className="text-center cursor-pointer"
              onClick={() => handleSort("applied_position")}
            >
              Applied Position{" "}
              {sortKey === "applied_position" && (
                <ArrowUpDown className="inline-block h-4 w-4" />
              )}
            </TableHead>
            <TableHead
              className="text-center cursor-pointer"
              onClick={() => handleSort("status")}
            >
              Status{" "}
              {sortKey === "status" && (
                <ArrowUpDown className="inline-block h-4 w-4" />
              )}
            </TableHead>
            <TableHead
              className="text-center cursor-pointer"
              onClick={() => handleSort("created_at")}
            >
              Date Applied{" "}
              {sortKey === "created_at" && (
                <ArrowUpDown className="inline-block h-4 w-4" />
              )}
            </TableHead>
            <TableHead className="text-center">CV</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentData.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.full_name}</TableCell>
              <TableCell>{c.applied_position}</TableCell>
              <TableCell>{c.status ?? "New"}</TableCell>
              <TableCell>{format(parseISO(c.created_at), "PPP")}</TableCell>
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
      <div className="flex justify-end gap-2 mt-4">
        <Button disabled={!hasPrev} onClick={loadPrevPage}>
          Previous
        </Button>
        <Button disabled={!hasNext} onClick={loadNextPage}>
          Next
        </Button>
      </div>
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