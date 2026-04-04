/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react"

const STORAGE_KEY = "collabx-theme"
const ThemeContext = createContext(null)

const getInitialTheme = () => {
 if (typeof window === "undefined") return "dark"

 const storedTheme = window.localStorage.getItem(STORAGE_KEY)
 if (storedTheme === "light" || storedTheme === "dark") return storedTheme

 return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark"
}

export const ThemeProvider = ({ children }) => {
 const [theme, setTheme] = useState(getInitialTheme)

 useEffect(() => {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  window.localStorage.setItem(STORAGE_KEY, theme)
 }, [theme])

 const value = useMemo(
  () => ({
   theme,
   toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
  }),
  [theme]
 )

 return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
 const context = useContext(ThemeContext)

 if (!context) {
  throw new Error("useTheme must be used within ThemeProvider")
 }

 return context
}
