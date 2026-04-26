import { FiLogOut } from "react-icons/fi"
import { useNavigate } from "react-router-dom"

const LogoutButton = ({ className = "btn-ghost px-4 py-3 text-sm" }) => {
 const navigate = useNavigate()

 const handleLogout = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  localStorage.removeItem("activeProjectId")
  navigate("/", { replace: true })
 }

 return (
  <button
   onClick={handleLogout}
   className={className}
   type="button"
   title="Logout"
  >
   <FiLogOut />
   Logout
  </button>
 )
}

export default LogoutButton
