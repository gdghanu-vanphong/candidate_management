import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import z from "zod"
import { supabase } from '@/lib/supabase'
import { toast } from "sonner"


export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const formSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: "Passwords do not match",
    })
  type signupForm = z.infer<typeof formSchema>
  const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<signupForm>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      },
    })
  
  const onSubmit = async (data: signupForm) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
        },
      },
    })
    
      if (error) toast.error(error.message)
      else {
        toast.success("Account created successfully, you will be redirected to dashboard shortly!")
        setTimeout(() => navigate("/login"), 2000)
      }
  }
  const navigate = useNavigate();
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input id="name" type="text" placeholder="John Doe" {...register('name', { required: true })} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </Field>
            <Field>
              <FieldLabel htmlFor="email" aria-required="true">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register('email', { required: true })}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              <FieldDescription>
                We&apos;ll use this to contact you. We will not share your email
                with anyone else.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input id="password" type="password" {...register('password', { required: true })} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <Input id="confirm-password" type="password" {...register('confirmPassword', { required: true })} />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit" className="cursor-pointer">Create Account</Button>
                <FieldDescription>
                  <span
                  >
                    Already have an account?
                  </span>
                  <span
                    className="underline cursor-pointer ml-1"
                    onClick={() => navigate('/')}
                  >
                    Sign in
                  </span>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
