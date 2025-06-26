"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

type UserRole = "admin" | "standart"

interface AuthContextType {
  user: User | null
  userRole: UserRole | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUserRole: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.log("Initial session:", session?.user?.email || "No user")
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchUserRole(session.user.id)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error("Error getting initial session:", error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email || "No user")

      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchUserRole(session.user.id)
      } else {
        setUserRole(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserRole = async (userId: string) => {
    try {
      console.log("Fetching role for user:", userId)

      // Önce tabloyu kontrol et
      const { data: tableCheck, error: tableError } = await supabase.from("profiles").select("count").limit(1)

      if (tableError) {
        if (tableError.message.includes("does not exist")) {
          console.log("Profiles table does not exist yet")
          setUserRole(null)
          setLoading(false)
          return
        }
        throw tableError
      }

      const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).limit(1).single()

      if (error) {
        if (error.code === "PGRST116") {
          console.log("No profile found for user:", userId)
          setUserRole(null)
        } else {
          console.error("Error fetching user role:", error)
          throw error
        }
      } else if (data) {
        console.log("User role fetched:", data.role)
        setUserRole(data.role)
      }
    } catch (error) {
      console.error("Error in fetchUserRole:", error)
      setUserRole(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshUserRole = async () => {
    if (user) {
      setLoading(true)
      await fetchUserRole(user.id)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        loading,
        signIn,
        signOut,
        refreshUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
