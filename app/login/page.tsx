import { LoginForm } from "@/components/auth/login-form"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <LoginForm />

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">{"Don't have an account?"}</p>
          <Link href="/register" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
            Sign up here
          </Link>
        </div>
      </div>
    </div>
  )
}
