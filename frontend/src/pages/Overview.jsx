import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
 FiArrowLeft,
 FiBriefcase,
 FiCheckCircle,
 FiClipboard,
 FiLayers,
 FiUser,
} from "react-icons/fi"
import API from "../services/api"

const formatDate = (value) => {
 if (!value) return "No due date"

 return new Date(value).toLocaleDateString([], {
  day: "numeric",
  month: "short",
  year: "numeric",
 })
}

const Overview = () => {
 const navigate = useNavigate()
 const [overview, setOverview] = useState(null)
 const [loading, setLoading] = useState(true)

 useEffect(() => {
  const fetchOverview = async () => {
   try {
    const res = await API.get("/dashboard/overview")
    setOverview(res.data)
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

      <button
      onClick={() => navigate("/dashboard")}
      className="btn-ghost px-4 py-3 text-sm"
     >
      <FiArrowLeft />
      Back to workspace
     </button>
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
          overview.assignedTasks.map((task) => (
           <div
            key={task._id}
            className="stat-card rounded-[22px] px-4 py-4"
           >
            <div className="flex items-start justify-between gap-3">
             <div>
              <p className="text-sm font-semibold text-primary">{task.title}</p>
              <p className="mt-1 text-sm text-secondary">{task.project?.name}</p>
             </div>
             <span className="token-pill border-[color:color-mix(in_srgb,var(--accent-primary)_26%,var(--border-color))] bg-[color:color-mix(in_srgb,var(--accent-primary)_12%,var(--surface-2))] text-[var(--accent-primary)]">
              {task.priority}
             </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-secondary">
             {task.description || "No task description yet."}
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted">
             Due {formatDate(task.dueDate)}
            </p>
           </div>
          ))
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
