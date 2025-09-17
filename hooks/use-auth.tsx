"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  userType: "customer" | "vendor" | "driver" | "admin"
  profileImage?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (userData: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check for stored auth token on mount
    const token = localStorage.getItem("auth_token")
    if (token) {
      // In a real app, you'd validate the token with your API
      // For now, we'll just set a mock user
      setUser({
        id: "1",
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        userType: "customer",
      })
      setIsAuthenticated(true)
    }
  }, [])

  const login = async (email: string, password: string) => {
    // Mock login - replace with actual API call
    const mockUser = {
      id: "1",
      email,
      firstName: "John",
      lastName: "Doe",
      userType: "customer" as const,
    }

    setUser(mockUser)
    setIsAuthenticated(true)
    localStorage.setItem("auth_token", "mock_token")
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("auth_token")
  }

  const register = async (userData: any) => {
    // Mock registration - replace with actual API call
    const mockUser = {
      id: "1",
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      userType: "customer" as const,
    }

    setUser(mockUser)
    setIsAuthenticated(true)
    localStorage.setItem("auth_token", "mock_token")
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, register }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
