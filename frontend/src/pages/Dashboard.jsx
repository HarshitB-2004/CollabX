import { useEffect, useMemo, useRef, useState } from "react"
import Sidebar from "../components/Sidebar"
import ChannelList from "../components/ChannelList"
import ChatWindow from "../components/ChatWindow"
import { useNavigate } from "react-router-dom"
import {
 FiAlertCircle,
 FiBell,
 FiCheckSquare,
 FiGrid,
 FiUsers,
} from "react-icons/fi"
import ThemeToggle from "../components/ThemeToggle"
import API from "../services/api"
import LogoutButton from "../components/LogoutButton"
import { socket } from "../socket/socket"

const formatAlertTime = (value) =>
 new Date(value).toLocaleDateString([], {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
 })

const Dashboard = () => {
 const [selectedProject, setSelectedProject] = useState(null)
 const [selectedChannel, setSelectedChannel] = useState(null)
 const [notificationsOpen, setNotificationsOpen] = useState(false)
 const [deadlineAlerts, setDeadlineAlerts] = useState([])
 const [huddleAlerts, setHuddleAlerts] = useState([])
 const navigate = useNavigate()
 const shownNotificationsRef = useRef(new Set())
 const currentUser = JSON.parse(localStorage.getItem("user") || "null")
 const currentUserId = currentUser?.id || currentUser?._id

 const alertCount = deadlineAlerts.length + huddleAlerts.length
 const sortedAlerts = useMemo(
  () =>
   [...deadlineAlerts].sort((a, b) => {
    if (a.level === b.level) {
     return new Date(a.dueDate) - new Date(b.dueDate)
    }

    return a.level === "overdue" ? -1 : 1
   }),
  [deadlineAlerts]
 )

 useEffect(() => {
  let cancelled = false

  const fetchAlerts = async () => {
   try {
    const res = await API.get("/dashboard/overview")
    if (!cancelled) {
      setDeadlineAlerts(res.data.deadlineAlerts || [])
    }
   } catch (err) {
    console.log(err)
   }
  }

  fetchAlerts()
  const interval = setInterval(fetchAlerts, 60000)

  return () => {
   cancelled = true
   clearInterval(interval)
  }
 }, [])

 useEffect(() => {
  if (typeof window === "undefined" || !("Notification" in window)) return
  if (Notification.permission === "default") {
   Notification.requestPermission().catch(() => {})
  }
 }, [])

 useEffect(() => {
  if (typeof window === "undefined" || !("Notification" in window)) return
  if (Notification.permission !== "granted") return

  sortedAlerts.forEach((alert) => {
   const key = `${alert._id}-${alert.level}`
   if (shownNotificationsRef.current.has(key)) return

   const body =
    alert.level === "overdue"
     ? `${alert.title} in ${alert.projectName} is overdue.`
     : `${alert.title} in ${alert.projectName} is due soon.`

   new Notification("CollabX reminder", { body })
   shownNotificationsRef.current.add(key)
  })
 }, [sortedAlerts])

 useEffect(() => {
  const handleHuddleStarted = (payload) => {
   if (payload.startedBy?.id === currentUserId) return

   const nextAlert = {
    id: `${payload.channelId}-${Date.now()}`,
    channelId: payload.channelId,
    startedBy: payload.startedBy,
    participantCount: payload.participantCount || 1,
    mode: payload.mode || "audio",
    createdAt: new Date().toISOString()
   }

   setHuddleAlerts((prev) => [nextAlert, ...prev].slice(0, 5))

   if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    new Notification("CollabX huddle started", {
     body: `${payload.startedBy?.name || "A teammate"} started a ${payload.mode || "audio"} huddle.`
    })
   }
  }

  const handleHuddleEnded = (payload) => {
   setHuddleAlerts((prev) => prev.filter((alert) => alert.channelId !== payload.channelId))
  }

  socket.on("huddleStarted", handleHuddleStarted)
  socket.on("huddleEnded", handleHuddleEnded)

  return () => {
   socket.off("huddleStarted", handleHuddleStarted)
   socket.off("huddleEnded", handleHuddleEnded)
  }
 }, [currentUserId])

  return (
  <div className="page-shell h-screen overflow-hidden px-3 py-3 md:px-4 md:py-4">
   <div className="glass-shell flex h-full flex-col overflow-hidden rounded-[28px]">
    <div className="flex flex-col gap-4 border-b border-[color:var(--border-color)] px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
     <div>
      <p className="eyebrow text-[11px] font-semibold uppercase tracking-[0.22em]">
       CollabX
      </p>
      <h1 className="mt-1 text-xl font-semibold text-primary sm:text-2xl">
       Workspace
      </h1>
      <p className="mt-1 text-sm text-secondary">
       {selectedChannel
        ? `Working in #${selectedChannel.name}`
        : "Choose a workspace and channel to begin"}
      </p>
     </div>

     <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
       <button
        onClick={() => setNotificationsOpen((current) => !current)}
        className="btn-ghost px-3.5 py-2 text-sm"
        title="Notifications"
       >
        <FiBell />
        Alerts
        {alertCount > 0 ? (
         <span className="rounded-full bg-[var(--accent-secondary)] px-1.5 py-0.5 text-[10px] font-semibold text-[#09111f]">
          {alertCount}
         </span>
        ) : null}
       </button>

       {notificationsOpen ? (
        <div className="absolute right-0 top-12 z-30 w-80 rounded-[22px] border border-[color:var(--border-color)] bg-[color:var(--surface-strong)] p-3 shadow-[var(--shadow-soft)]">
         <div className="flex items-center justify-between gap-3 px-2 py-2">
          <div>
           <p className="eyebrow text-[10px] font-semibold uppercase tracking-[0.16em]">
            Notifications
           </p>
           <h2 className="mt-1 text-sm font-semibold text-primary">Task reminders</h2>
          </div>
          <span className="token-pill">{alertCount}</span>
         </div>

         <div className="mt-2 max-h-80 space-y-2 overflow-y-auto">
          {huddleAlerts.map((alert) => (
           <div
            key={alert.id}
            className="rounded-[18px] border border-[color:color-mix(in_srgb,var(--accent-primary)_24%,var(--border-color))] bg-[color:color-mix(in_srgb,var(--accent-primary)_10%,var(--surface-2))] px-3 py-3"
           >
            <div className="flex items-start gap-3">
             <div className="mt-0.5 rounded-full bg-[color:color-mix(in_srgb,var(--accent-primary)_18%,transparent)] p-2 text-[var(--accent-primary)]">
              <FiUsers size={14} />
             </div>
             <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">
               {alert.startedBy?.name || "A teammate"} started a {alert.mode} huddle
              </p>
              <p className="mt-1 text-xs text-secondary">
               Open that channel and press Join to enter.
              </p>
             </div>
            </div>
           </div>
          ))}

          {sortedAlerts.length > 0 ? (
           sortedAlerts.map((alert) => (
            <div
             key={`${alert._id}-${alert.level}`}
             className="rounded-[18px] border border-[color:var(--border-color)] bg-[color:var(--surface-2)] px-3 py-3"
            >
             <div className="flex items-start gap-3">
              <div className={`mt-0.5 rounded-full p-2 ${alert.level === "overdue" ? "bg-[color:color-mix(in_srgb,var(--accent-secondary)_18%,transparent)] text-[var(--accent-secondary)]" : "bg-[color:color-mix(in_srgb,var(--accent-primary)_18%,transparent)] text-[var(--accent-primary)]"}`}>
               <FiAlertCircle size={14} />
              </div>
              <div className="min-w-0">
               <p className="text-sm font-semibold text-primary">{alert.title}</p>
               <p className="mt-1 text-xs text-secondary">{alert.projectName}</p>
               <p className="mt-2 text-xs text-secondary">
                {alert.level === "overdue" ? "Overdue" : "Due soon"} - {formatAlertTime(alert.dueDate)}
               </p>
              </div>
             </div>
           </div>
           ))
          ) : huddleAlerts.length === 0 ? (
           <div className="rounded-[18px] border border-dashed border-[color:var(--border-soft)] px-4 py-8 text-center text-sm text-secondary">
            No pending reminders right now.
           </div>
          ) : null}
         </div>
        </div>
       ) : null}
      </div>

      <button
       onClick={() => navigate("/people")}
       className="btn-ghost px-3.5 py-2 text-sm"
      >
       <FiUsers />
       People
      </button>

      <button
       onClick={() => navigate("/overview")}
       className="btn-ghost px-3.5 py-2 text-sm"
      >
       <FiGrid />
       Overview
      </button>

      <button
       onClick={() => navigate("/tasks")}
       className="btn-secondary px-3.5 py-2 text-sm"
      >
       <FiCheckSquare />
       Tasks
      </button>

      <ThemeToggle />
      <LogoutButton className="btn-ghost px-3.5 py-2 text-sm" />
     </div>
    </div>

    <div className="dashboard-layout min-h-0 flex-1">
     <Sidebar
      selectedProject={selectedProject}
      setSelectedProject={setSelectedProject}
      setSelectedChannel={setSelectedChannel}
     />

     <ChannelList
      selectedProject={selectedProject}
      selectedChannel={selectedChannel}
      setSelectedChannel={setSelectedChannel}
     />

     <ChatWindow
      selectedChannel={selectedChannel}
      selectedProject={selectedProject}
     />
    </div>
   </div>
  </div>
 )
}

export default Dashboard
