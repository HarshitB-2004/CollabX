import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
 FiArrowLeft,
 FiBookOpen,
 FiBriefcase,
 FiCheckCircle,
 FiClipboard,
 FiLayers,
 FiUser,
} from "react-icons/fi"
import API from "../services/api"
import ThemeToggle from "../components/ThemeToggle"
import LogoutButton from "../components/LogoutButton"

const formatDate = (value) => {
 if (!value) return "No due date"

 return new Date(value).toLocaleDateString([], {
  day: "numeric",
  month: "short",
  year: "numeric",
 })
}

const getTaskDeadlineTone = (dueDate) => {
 if (!dueDate) {
  return {
   label: "Flexible",
   dotClass: "bg-slate-400/70",
   chipClass: "border-[color:var(--border-soft)] bg-[color:var(--surface-2)] text-secondary",
   cardStyle: {},
  }
 }

 const now = new Date()
 const due = new Date(dueDate)
 const diffMs = due.getTime() - now.getTime()
 const diffHours = diffMs / (1000 * 60 * 60)

 if (diffMs < 0) {
  return {
   label: "Overdue",
   dotClass: "bg-rose-500",
   chipClass:
    "border-[color:rgba(244,63,94,0.25)] bg-[color:rgba(244,63,94,0.14)] text-rose-200",
   cardStyle: {
    borderColor: "rgba(244, 63, 94, 0.26)",
    background:
     "linear-gradient(180deg, rgba(244, 63, 94, 0.12), color-mix(in srgb, var(--surface-2) 94%, transparent))",
   },
  }
 }

 if (diffHours <= 24) {
  return {
   label: "Urgent",
   dotClass: "bg-rose-400",
   chipClass:
    "border-[color:rgba(251,113,133,0.24)] bg-[color:rgba(251,113,133,0.12)] text-rose-200",
   cardStyle: {
    borderColor: "rgba(251, 113, 133, 0.24)",
    background:
     "linear-gradient(180deg, rgba(251, 113, 133, 0.1), color-mix(in srgb, var(--surface-2) 96%, transparent))",
   },
  }
 }

 if (diffHours <= 72) {
  return {
   label: "Due soon",
   dotClass: "bg-amber-400",
   chipClass:
    "border-[color:rgba(251,191,36,0.24)] bg-[color:rgba(251,191,36,0.12)] text-amber-200",
   cardStyle: {
    borderColor: "rgba(251, 191, 36, 0.24)",
    background:
     "linear-gradient(180deg, rgba(251, 191, 36, 0.08), color-mix(in srgb, var(--surface-2) 96%, transparent))",
   },
  }
 }

 return {
  label: "On track",
  dotClass: "bg-emerald-400",
  chipClass:
   "border-[color:rgba(52,211,153,0.22)] bg-[color:rgba(52,211,153,0.12)] text-emerald-200",
  cardStyle: {
   borderColor: "rgba(52, 211, 153, 0.2)",
   background:
    "linear-gradient(180deg, rgba(52, 211, 153, 0.06), color-mix(in srgb, var(--surface-2) 96%, transparent))",
  },
 }
}

const Overview = () => {
 const navigate = useNavigate()
 const [overview, setOverview] = useState(null)
 const [insights, setInsights] = useState([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
  const fetchOverview = async () => {
   try {
    const [overviewRes, insightRes] = await Promise.all([
     API.get("/dashboard/overview"),
     API.get("/ai/library"),
    ])
    setOverview(overviewRes.data)
    setInsights(insightRes.data)
   } catch (err) {
    console.log(err)
   } finally {
    setLoading(false)
   }
  }

  fetchOverview()
 }, [])

 const metrics = overview
  ? [
     {
      label: "Workspaces",
      value: overview.workspaceOverview.totalProjects,
      icon: FiLayers,
     },
     {
      label: "Channels",
      value: overview.workspaceOverview.totalChannels,
      icon: FiBriefcase,
     },
     {
      label: "Open tasks",
      value:
       overview.workspaceOverview.totalTasks -
       overview.workspaceOverview.completedTasks,
      icon: FiClipboard,
     },
     {
      label: "Completed",
      value: overview.workspaceOverview.completedTasks,
      icon: FiCheckCircle,
     },
    ]
  : []

 return (
  <div className="page-shell px-4 py-4 md:px-6">
   <div className="glass-shell mx-auto min-h-[calc(100vh-2rem)] max-w-[1600px] rounded-[28px] p-6 md:p-8">
    <div className="mb-8 flex flex-col gap-4 border-b border-[color:var(--border-color)] pb-6 lg:flex-row lg:items-center lg:justify-between">
     <div>
      <p className="eyebrow text-xs font-semibold uppercase tracking-[0.32em]">
       Personal Dashboard
      </p>
      <h1 className="mt-2 text-3xl font-bold text-primary">Your workspace overview</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">
       Review your profile, assigned work, completed progress, and the overall health of your active workspaces.
      </p>
     </div>

     <div className="flex items-center gap-2">
     <button
       onClick={() => navigate("/dashboard")}
       className="btn-ghost px-4 py-3 text-sm"
      >
       <FiArrowLeft />
       Back to workspace
      </button>
      <ThemeToggle />
      <LogoutButton />
     </div>
    </div>

    {loading ? (
     <div className="glass-subtle rounded-[28px] px-6 py-16 text-center text-secondary">
      Loading dashboard...
     </div>
    ) : overview ? (
     <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
       <section className="glass-panel rounded-[28px] p-6">
        <div className="flex items-center gap-4">
         <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[color:color-mix(in_srgb,var(--accent-primary)_14%,transparent)] text-[var(--accent-primary)]">
          <FiUser size={28} />
         </div>
         <div>
          <p className="eyebrow text-xs font-semibold uppercase tracking-[0.28em]">
           Profile
          </p>
          <h2 className="mt-2 text-2xl font-bold text-primary">{overview.profile.name}</h2>
          <p className="mt-1 text-sm text-secondary">{overview.profile.email}</p>
         </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
         {metrics.map((metric) => {
          const Icon = metric.icon

          return (
           <div
            key={metric.label}
            className="stat-card rounded-[24px] p-5"
           >
            <div className="flex items-center justify-between">
             <p className="text-sm text-secondary">{metric.label}</p>
             <Icon className="text-[var(--accent-primary)]" />
            </div>
            <p className="mt-4 text-3xl font-bold text-primary">{metric.value}</p>
           </div>
          )
         })}
        </div>
       </section>

       <section className="glass-panel rounded-[28px] p-6">
        <p className="eyebrow text-xs font-semibold uppercase tracking-[0.28em]">
         Workspace overview
        </p>
        <div className="mt-5 space-y-4">
         {overview.projects.length > 0 ? (
          overview.projects.map((project) => (
           <div
            key={project._id}
            className="stat-card rounded-[22px] px-4 py-4"
           >
            <div className="flex items-center justify-between gap-3">
             <div>
              <p className="text-sm font-semibold text-primary">{project.name}</p>
              <p className="mt-1 text-sm text-secondary">
               {project.description || "No description added yet."}
              </p>
             </div>
             <span className="token-pill">
              {project.members?.length || 1} members
             </span>
            </div>
           </div>
          ))
         ) : (
          <div className="glass-subtle rounded-[22px] border-dashed px-5 py-10 text-center text-secondary">
           No projects found yet.
          </div>
         )}
        </div>
      </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
       <section className="glass-panel rounded-[28px] p-6">
        <div className="mb-5 flex items-center justify-between">
         <div>
          <p className="eyebrow text-xs font-semibold uppercase tracking-[0.28em]">
           Assigned tasks
          </p>
          <h2 className="mt-2 text-xl font-bold text-primary">What needs your attention</h2>
         </div>
         <span className="token-pill">
          {overview.assignedTasks.length} active
         </span>
        </div>

        <div className="space-y-3">
         {overview.assignedTasks.length > 0 ? (
          overview.assignedTasks.map((task) => {
           const deadlineTone = getTaskDeadlineTone(task.dueDate)

           return (
           <div
            key={task._id}
            className="rounded-[22px] border px-4 py-4 shadow-[var(--shadow-soft)] transition hover:translate-y-[-1px]"
            style={deadlineTone.cardStyle}
           >
            <div className="flex items-start justify-between gap-3">
             <div>
              <p className="text-sm font-semibold text-primary">{task.title}</p>
              <p className="mt-1 text-sm text-secondary">{task.project?.name}</p>
             </div>
             <div className="flex flex-col items-end gap-2">
              <span className="token-pill border-[color:color-mix(in_srgb,var(--accent-primary)_26%,var(--border-color))] bg-[color:color-mix(in_srgb,var(--accent-primary)_12%,var(--surface-2))] text-[var(--accent-primary)]">
               {task.priority}
              </span>
              <span className={`token-pill ${deadlineTone.chipClass}`}>
               <span className={`h-2 w-2 rounded-full ${deadlineTone.dotClass}`}></span>
               {deadlineTone.label}
              </span>
             </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-secondary">
             {task.description || "No task description yet."}
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted">
             Due {formatDate(task.dueDate)}
            </p>
           </div>
          )})
         ) : (
          <div className="glass-subtle rounded-[22px] border-dashed px-5 py-10 text-center text-secondary">
           No active assignments yet.
          </div>
         )}
        </div>
       </section>

       <section className="glass-panel rounded-[28px] p-6">
        <div className="mb-5 flex items-center justify-between">
         <div>
          <p className="eyebrow text-xs font-semibold uppercase tracking-[0.28em]">
           Completed tasks
          </p>
          <h2 className="mt-2 text-xl font-bold text-primary">Recent wins</h2>
         </div>
         <span className="token-pill">
          {overview.completedTasks.length} done
         </span>
        </div>

        <div className="space-y-3">
         {overview.completedTasks.length > 0 ? (
          overview.completedTasks.map((task) => (
           <div
            key={task._id}
            className="rounded-[22px] border px-4 py-4"
            style={{
             borderColor: "color-mix(in srgb, var(--accent-success) 18%, var(--border-color))",
             background: "color-mix(in srgb, var(--accent-success) 10%, var(--surface-2))",
            }}
           >
            <div className="flex items-start justify-between gap-3">
             <div>
              <p className="text-sm font-semibold text-primary">{task.title}</p>
              <p className="mt-1 text-sm text-secondary">{task.project?.name}</p>
             </div>
             <FiCheckCircle className="text-[var(--accent-success)]" />
            </div>
            <p className="mt-3 text-sm leading-6 text-secondary">
             {task.description || "Completed without an added description."}
            </p>
           </div>
          ))
         ) : (
          <div className="glass-subtle rounded-[22px] border-dashed px-5 py-10 text-center text-secondary">
           No completed tasks yet.
          </div>
         )}
        </div>
       </section>
      </div>

      <section className="glass-panel rounded-[28px] p-6">
       <div className="mb-5 flex items-center justify-between">
        <div>
         <p className="eyebrow text-xs font-semibold uppercase tracking-[0.28em]">
          AI library
         </p>
         <h2 className="mt-2 text-xl font-bold text-primary">Saved summaries and action plans</h2>
        </div>
        <span className="token-pill">
         {insights.length} saved
        </span>
       </div>

       <div className="space-y-3">
        {insights.length > 0 ? (
         insights.map((insight) => (
          <div
           key={insight._id}
           className="stat-card rounded-[24px] px-5 py-5"
          >
           <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
             <div className="flex flex-wrap items-center gap-2">
              <span className="token-pill">
               <FiBookOpen size={12} />
               {insight.type === "summary" ? "Summary" : "Action plan"}
              </span>
              <span className="token-pill">
               {insight.project?.name || "Workspace"}
              </span>
              <span className="token-pill">
               #{insight.channel?.name || "channel"}
              </span>
             </div>
             <h3 className="mt-3 text-lg font-semibold text-primary">{insight.name}</h3>
             <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-secondary">
              {insight.content}
             </p>
            </div>

            <div className="shrink-0 space-y-2 text-sm text-secondary">
             <p>
              Saved on {formatDate(insight.createdAt)}
             </p>
             {insight.relatedTasks?.length ? (
              <p className="token-pill">
               {insight.relatedTasks.length} tasks created
              </p>
             ) : null}
            </div>
           </div>
          </div>
         ))
        ) : (
         <div className="glass-subtle rounded-[22px] border-dashed px-5 py-10 text-center text-secondary">
          Save a summary or action plan from the chat AI tools and it will appear here.
         </div>
        )}
       </div>
      </section>
     </div>
    ) : (
     <div className="glass-subtle rounded-[28px] border-dashed px-6 py-16 text-center text-secondary">
      Unable to load dashboard data right now.
     </div>
    )}
   </div>
  </div>
 )
}

export default Overview
