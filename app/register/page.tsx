import { RegisterForm } from "@/components/auth/register-form"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <RegisterForm />

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Already have an account?</p>
          <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  )
}
