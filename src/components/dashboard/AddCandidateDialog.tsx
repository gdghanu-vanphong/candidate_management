import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

import { z } from "zod"

const addCandidateSchema = z.object({
  full_name: z.string().min(2, "Full name too short"),
  applied_position: z.string().min(2, "Position too short"),
  cv: z.instanceof(File).optional(),
})

export type AddCandidateForm = z.infer<typeof addCandidateSchema>


export default function AddCandidateDialog() {
  const [loading, setLoading] = useState(false)

  const form = useForm<AddCandidateForm>({
    resolver: zodResolver(addCandidateSchema),
  })

  const onSubmit = async (values: AddCandidateForm) => {
    try {
      setLoading(true)

      let resumeUrl: string | undefined

      if (values.cv) {
        const filePath = `${Date.now()}-${values.cv.name}`

        const { data, error } = await supabase.storage
          .from("resumes")
          .upload(filePath, values.cv)

        if (error) throw error

        resumeUrl = supabase.storage
          .from("resumes")
          .getPublicUrl(data.path).data.publicUrl
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error("Not authenticated")
      }
      const user = await supabase.auth.getUser()
      
      const res = await fetch(
        "https://qgycdgakboszblnklumr.supabase.co/functions/v1/add_candidate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            full_name: values.full_name,
            applied_position: values.applied_position,
            status: "New",
            resume_url: resumeUrl,
            user_id: user.data.user?.id
          }),
        }
      )

      if (!res.ok) {
        const err = await res.text()
        throw new Error(err)
      }

      form.reset()
    } catch (err) {
      console.error("Add candidate error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Candidate</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Candidate</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <Input
            placeholder="Full name"
            {...form.register("full_name")}
            
          />
          {form.formState.errors.full_name && (
            <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
          )}
          <Input
            placeholder="Applied position"
            {...form.register("applied_position")}
          />
          {form.formState.errors.applied_position && (
            <p className="text-xs text-destructive">{form.formState.errors.applied_position.message}</p>
          )}
          <Input
            type="file"
            onChange={(e) =>
              form.setValue("cv", e.target.files?.[0])
            }
          />
          {form.formState.errors.cv && (
            <p className="text-xs text-destructive">{form.formState.errors.cv.message}</p>
          )}
          <Button disabled={loading} type="submit">
            {loading ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
