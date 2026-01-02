import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
export default function ConfirmEmail() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Confirm Email</CardTitle>
            <CardDescription>Please confirm your email address.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Thank you for registering!</p>
            <p>A mail has been sent to your email address.</p>
            <p>Please confirm your email address.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}