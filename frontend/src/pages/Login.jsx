import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import API from "../services/api"
import { FiArrowRight, FiLock, FiMail, FiMessageSquare } from "react-icons/fi"

const Login = () => {

 const navigate = useNavigate()

 const [email,setEmail] = useState("")
 const [password,setPassword] = useState("")
 const [error,setError] = useState("")

 const handleLogin = async(e)=>{

  e.preventDefault()

  if(!email.trim() || !password.trim()){
   setError("Email and password are required")
   return
  }

  setError("")

  try{

   const res = await API.post("/auth/login",{
    email,
    password
   })

   localStorage.setItem("token",res.data.token)
localStorage.setItem("user",JSON.stringify(res.data.user))

   navigate("/dashboard")

  }catch(err){
   setError(err.response?.data?.message || "Invalid credentials")

  }

 }

 return(
  <div className="page-shell relative overflow-hidden px-4 py-10">
   <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--accent-primary)_24%,transparent),transparent_28%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--accent-secondary)_18%,transparent),transparent_34%)]" />

   <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
    <div className="glass-shell hidden rounded-[36px] p-10 lg:block">
     <div className="auth-hero-brand">
      <p className="auth-hero-brand__label">Team workspace platform</p>
      <h1 className="auth-hero-brand__title">CollabX</h1>
      <p className="auth-hero-brand__description">
       One shared place for conversations, coordination, and delivery.
      </p>
     </div>

     <div className="token-pill">
      <FiMessageSquare />
      Real-time team collaboration
     </div>

     <h2 className="mt-8 max-w-xl text-4xl font-extrabold leading-[1.08] text-primary">
      Move from conversation to execution without switching tools.
     </h2>

     <p className="mt-4 max-w-xl text-base leading-7 text-secondary">
      CollabX keeps workspaces, channels, messaging, and tasks together in one polished team hub.
     </p>

     <div className="mt-10 grid gap-4 md:grid-cols-3">
      {[
       { label: "Projects", value: "Organized" },
       { label: "Chat", value: "Live" },
       { label: "Tasks", value: "Trackable" },
      ].map((item) => (
       <div key={item.label} className="stat-card rounded-3xl p-5">
        <p className="text-sm uppercase tracking-[0.24em] text-muted">{item.label}</p>
        <p className="mt-3 text-2xl font-bold text-primary">{item.value}</p>
       </div>
      ))}
     </div>
    </div>

   <div className="glass-shell mx-auto w-full max-w-md rounded-[32px] p-8 sm:p-10">
     <p className="eyebrow text-xs font-semibold uppercase tracking-[0.3em]">
      Welcome Back
     </p>
     <h2 className="mt-3 text-3xl font-bold text-primary">
      Sign in to your workspace
     </h2>
     <p className="mt-3 text-sm leading-6 text-secondary">
      Continue your team conversations, track progress, and stay aligned across every project.
     </p>

     <form onSubmit={handleLogin} className="mt-8 space-y-4">
      <div className="glass-subtle flex items-center rounded-2xl px-4 py-3">
      <FiMail className="text-muted"/>
      <input
       type="email"
       placeholder="Email"
       value={email}
       onChange={(e)=>setEmail(e.target.value)}
       className="ml-3 w-full bg-transparent text-primary outline-none placeholder:text-[var(--text-muted)]"
      />
     </div>

     <div className="glass-subtle flex items-center rounded-2xl px-4 py-3">
      <FiLock className="text-muted"/>
      <input
       type="password"
       placeholder="Password"
       value={password}
       onChange={(e)=>setPassword(e.target.value)}
       className="ml-3 w-full bg-transparent text-primary outline-none placeholder:text-[var(--text-muted)]"
      />
     </div>

     <button className="btn-primary w-full rounded-2xl py-3">
      Sign in
      <FiArrowRight />
     </button>

     {error ? <p className="text-sm text-[var(--accent-secondary)]">{error}</p> : null}
    </form>

    <p className="mt-6 text-sm text-center text-secondary">
     Don't have an account?  
     <Link
      to="/register"
      className="ml-1 font-semibold text-[var(--accent-primary)]"
     >
      Register
     </Link>
    </p>
    </div>
   </div>
  </div>
 )
}

export default Login
