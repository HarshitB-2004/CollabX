import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import API from "../services/api"
import { FiArrowRight, FiLock, FiMail, FiUser, FiZap } from "react-icons/fi"

const Register = ()=>{

 const navigate = useNavigate()

 const [name,setName] = useState("")
 const [email,setEmail] = useState("")
 const [password,setPassword] = useState("")
 const [error,setError] = useState("")

 const handleRegister = async(e)=>{

  e.preventDefault()

  if(!name.trim() || !email.trim() || !password.trim()){
   setError("Name, email, and password are required")
   return
  }

  if(password.trim().length < 6){
   setError("Password must be at least 6 characters")
   return
  }

  setError("")

  try{

   const res = await API.post("/auth/register",{
    name,
    email,
    password
   })

   localStorage.setItem("token",res.data.token)
   localStorage.setItem("user",JSON.stringify(res.data.user))
   navigate("/dashboard")

  }catch(err){
   setError(err.response?.data?.message || "Registration failed")

  }

 }

 return(
  <div className="page-shell relative overflow-hidden px-4 py-10">
   <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--accent-primary)_22%,transparent),transparent_26%),radial-gradient(circle_at_bottom_left,color-mix(in_srgb,var(--accent-secondary)_18%,transparent),transparent_30%)]" />

   <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
    <div className="glass-shell mx-auto w-full max-w-md rounded-[32px] p-8 sm:p-10">
     <p className="eyebrow text-xs font-semibold uppercase tracking-[0.3em]">
      Start Here
     </p>
     <h2 className="mt-3 text-3xl font-bold text-primary">
      Create your CollabX account
     </h2>
     <p className="mt-3 text-sm leading-6 text-secondary">
      Set up your team space, open channels, and keep tasks and discussions moving in one workflow.
     </p>

    <form onSubmit={handleRegister} className="mt-8 space-y-4">
     <div className="glass-subtle flex items-center rounded-2xl px-4 py-3">
      <FiUser className="text-muted"/>
      <input
       type="text"
       placeholder="Full Name"
       value={name}
       onChange={(e)=>setName(e.target.value)}
       className="ml-3 w-full bg-transparent text-primary outline-none placeholder:text-[var(--text-muted)]"
      />
     </div>

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
      Create account
      <FiArrowRight />
     </button>

     {error ? <p className="text-sm text-[var(--accent-secondary)]">{error}</p> : null}
    </form>

    <p className="mt-6 text-sm text-center text-secondary">
     Already have an account?  
     <Link
      to="/"
      className="ml-1 font-semibold text-[var(--accent-primary)]"
     >
      Login
     </Link>
    </p>
    </div>

    <div className="glass-shell hidden rounded-[36px] p-10 lg:block">
     <div className="auth-hero-brand">
      <p className="auth-hero-brand__label">Team workspace platform</p>
      <h1 className="auth-hero-brand__title">CollabX</h1>
      <p className="auth-hero-brand__description">
       One shared place for conversations, coordination, and delivery.
      </p>
     </div>

     <div className="token-pill">
      <FiZap />
      Launch your workspace faster
     </div>

     <h2 className="mt-8 max-w-xl text-4xl font-extrabold leading-[1.08] text-primary">
      Build a cleaner, calmer operating system for team work.
     </h2>

     <p className="mt-4 max-w-xl text-base leading-7 text-secondary">
      Create a shared place for updates, channels, and task delivery so every conversation has clear next steps.
     </p>

     <div className="mt-10 space-y-4">
      {[
       "Create workspaces for each client or internal initiative.",
       "Separate conversations into channels by team, stream, or feature.",
       "Turn team context into coordinated execution with shared task boards.",
      ].map((item) => (
       <div key={item} className="stat-card rounded-3xl px-5 py-4 text-secondary">
        {item}
      </div>
      ))}
     </div>
    </div>
   </div>
  </div>
 )
}

export default Register
