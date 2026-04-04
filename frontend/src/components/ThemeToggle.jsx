import { FiMoon, FiSun } from "react-icons/fi"
import { useTheme } from "../theme/ThemeProvider"

const ThemeToggle = () => {
 const { theme, toggleTheme } = useTheme()
 const isDark = theme === "dark"

 return (
  <button
   onClick={toggleTheme}
   className="theme-toggle"
   aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
   type="button"
   title={`Switch to ${isDark ? "light" : "dark"} mode`}
  >
   <span className="theme-toggle__icon">{isDark ? <FiSun /> : <FiMoon />}</span>
   <span className="theme-toggle__text">{isDark ? "Light" : "Dark"}</span>
  </button>
 )
}

export default ThemeToggle
