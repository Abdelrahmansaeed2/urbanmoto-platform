interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  userType: "customer" | "driver" | "vendor" | "admin"
  isVerified: boolean
}

interface AuthResponse {
  user: User
  token: string
  message: string
}

class AuthService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

  async register(userData: {
    email: string
    phone: string
    password: string
    firstName: string
    lastName: string
    userType?: string
  }): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Registration failed")
    }

    const data = await response.json()

    // Store token in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("urbanmoto_token", data.token)
    }

    return data
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Login failed")
    }

    const data = await response.json()

    // Store token in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("urbanmoto_token", data.token)
    }

    return data
  }

  async verifyToken(): Promise<{ valid: boolean; user?: User }> {
    const token = this.getToken()

    if (!token) {
      return { valid: false }
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        this.logout()
        return { valid: false }
      }

      const data = await response.json()
      return data
    } catch (error) {
      this.logout()
      return { valid: false }
    }
  }

  getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("urbanmoto_token")
  }

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("urbanmoto_token")
    }
  }

  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken()

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    return fetch(url, {
      ...options,
      headers,
    })
  }
}

export const authService = new AuthService()
export type { User, AuthResponse }
