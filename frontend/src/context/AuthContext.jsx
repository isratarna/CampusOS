import * as React from "react"

import { api, apiError } from "@/lib/api"

/* ============================================================
   Session.

   The token is attached to the shared axios instance from
   lib/api.js — the same one CampusProvider and every page call
   through — so authorising here authorises the whole app rather
   than just the calls made from this file.
   ============================================================ */

const STORAGE_KEY = "sc_token"

const AuthContext = React.createContext(null)

/** Keep the bearer token on the shared instance and in storage together. */
function applyToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    try {
      localStorage.setItem(STORAGE_KEY, token)
    } catch {
      /* storage blocked; the session just ends with the tab */
    }
  } else {
    delete api.defaults.headers.common.Authorization
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* nothing to clear */
    }
  }
}

function storedToken() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null)
  const [token, setToken] = React.useState(() => storedToken())
  const [loading, setLoading] = React.useState(true)
  const [demoAccounts, setDemoAccounts] = React.useState([])
  const [demoError, setDemoError] = React.useState("")

  React.useEffect(() => {
    applyToken(token)
  }, [token])

  // one boot pass: offer the demo accounts, and resume a stored session
  React.useEffect(() => {
    let cancelled = false

    const boot = async () => {
      try {
        const res = await api.get("/auth/demo-accounts")
        if (!cancelled && res.data?.accounts) {
          setDemoAccounts(res.data.accounts)
          setDemoError("")
        }
      } catch (err) {
        // the sign-in page leans on these, so say why they are missing
        // rather than quietly rendering an empty panel
        if (!cancelled) setDemoError(apiError(err, "Demo profiles are unavailable."))
      }

      const existing = storedToken()
      if (existing) {
        applyToken(existing)
        try {
          const res = await api.get("/auth/me")
          if (!cancelled && res.data?.user) setUser(res.data.user)
        } catch {
          // expired or revoked — drop it rather than loop on 401s
          if (!cancelled) {
            setToken(null)
            setUser(null)
          }
          applyToken(null)
        }
      }

      if (!cancelled) setLoading(false)
    }

    boot()
    return () => {
      cancelled = true
    }
  }, [])

  const adopt = React.useCallback((data) => {
    if (!data?.token || !data?.user) throw new Error("Unexpected response from the server.")
    applyToken(data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const login = React.useCallback(
    async (email, password) => {
      const res = await api.post("/auth/login", { email, password })
      return adopt(res.data)
    },
    [adopt]
  )

  const register = React.useCallback(
    async (details) => {
      const res = await api.post("/auth/register", details)
      return adopt(res.data)
    },
    [adopt]
  )

  const logout = React.useCallback(() => {
    applyToken(null)
    setToken(null)
    setUser(null)
  }, [])

  /** Sign in as the seeded demo account for a role — powers "View as". */
  const quickSwitchDemoUser = React.useCallback(
    async (role) => {
      const target = demoAccounts.find((a) => a.role === role)
      if (!target) throw new Error(`No demo account seeded for '${role}'.`)
      return login(target.email, target.password)
    },
    [demoAccounts, login]
  )

  const value = React.useMemo(
    () => ({
      user,
      token,
      loading,
      demoAccounts,
      demoError,
      login,
      register,
      logout,
      quickSwitchDemoUser,
    }),
    [user, token, loading, demoAccounts, demoError, login, register, logout, quickSwitchDemoUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
