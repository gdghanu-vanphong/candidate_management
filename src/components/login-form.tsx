import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { supabase } from '@/lib/supabase'
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
import { useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const formSchema = z.object({
    email: z.email({ message: "Invalid email address" }).min(1, "Email is required"),
    password: z.string().min(8, "Password must be at least 8 characters").max(100),
  });
  const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        email: "",
        password: "",
      },
    })
  const navigate = useNavigate();
  
  const onSubmit = async (loginData: z.infer<typeof formSchema>) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password,
    });
    if (error) {
      toast.error(error.message)
    } else {
      navigate("/dashboard");
    }
  };
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  placeholder="m@example.com"
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                </div>
                <Input id="password" type="password" {...register("password")} name="password"/>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </Field>
              <Field>
                <Button className="cursor-pointer" size='sm' type="submit" >Login</Button>

                <FieldDescription className="text-center flex gap-x-1 justify-center">
                  Don&apos;t have an account? <p className="underline cursor-pointer" onClick={() => navigate('/signup')}>Sign up</p>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
