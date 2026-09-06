import axios from "axios"

/* Single axios instance for the whole app. Base URL is overridable so the
   build can point at a deployed API without touching call sites. */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
})

/** Pull a human-readable message out of whatever the API/network produced. */
export function apiError(err, fallback = "Something went wrong.") {
  if (err?.response?.data?.error) return err.response.data.error
  if (err?.response?.data?.message) return err.response.data.message
  if (err?.code === "ERR_NETWORK") return "Can't reach the server. Is the API running?"
  return err?.message || fallback
}
