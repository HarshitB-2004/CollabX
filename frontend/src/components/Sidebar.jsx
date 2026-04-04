import { useEffect, useState } from "react"
import API from "../services/api"
import { FiFolderPlus, FiLayers } from "react-icons/fi"

const Sidebar = ({ selectedProject, setSelectedProject, setSelectedChannel }) => {
 const [projects, setProjects] = useState([])

 const fetchProjects = async () => {
  const res = await API.get("/projects/my-projects")
  setProjects(res.data)

  if (!res.data.length || selectedProject) return

   const savedProjectId = localStorage.getItem("activeProjectId")
   const initialProject =
    res.data.find((project) => project._id === savedProjectId) || res.data[0]

   if (initialProject) {
    setSelectedProject(initialProject)
   }
 }

 useEffect(() => {
  let cancelled = false

  const loadProjects = async () => {
   const res = await API.get("/projects/my-projects")

   if (cancelled) return

   setProjects(res.data)

   if (!res.data.length || selectedProject) return

   const savedProjectId = localStorage.getItem("activeProjectId")
   const initialProject =
    res.data.find((project) => project._id === savedProjectId) || res.data[0]

   if (initialProject) {
    setSelectedProject(initialProject)
   }
  }

  loadProjects()

  return () => {
   cancelled = true
  }
 }, [])

 const createProject = async () => {
  const name = prompt("Enter Project Name")?.trim()

  if(!name){
   alert("Project name is required")
   return
  }

  try {
   await API.post("/projects/create", {
    name,
    description: "New Project"
   })

   fetchProjects()
  } catch (err) {
   console.log(err)
  }
 }

 return (
  <aside className="workspace-sidebar flex h-full min-h-0 flex-col border-r border-[color:var(--border-soft)] bg-[color:color-mix(in_srgb,var(--surface-1)_96%,transparent)] px-4 py-4">
   <div className="mb-4 flex items-center justify-between gap-3">
    <div>
     <p className="eyebrow text-[11px] font-semibold uppercase tracking-[0.22em]">
      Workspaces
     </p>
     <h2 className="mt-1 text-lg font-semibold text-primary">Projects</h2>
    </div>
    <div className="glass-subtle rounded-2xl p-2.5 text-[var(--accent-primary)]">
     <FiLayers />
    </div>
   </div>

   <button
    onClick={createProject}
    className="btn-primary mb-4 rounded-2xl px-4 py-3 text-sm"
   >
    <FiFolderPlus />
    New workspace
   </button>

   <div className="min-h-0 flex-1 overflow-y-auto pr-1">
    <ul className="space-y-2">
     {projects.map((project) => {
      const isActive = selectedProject?._id === project._id

      return (
       <li key={project._id}>
        <button
         onClick={() => {
          setSelectedProject(project)
          setSelectedChannel(null)
          localStorage.setItem("activeProjectId", project._id)
         }}
         className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
          isActive
          ? "accent-ring bg-[color:color-mix(in_srgb,var(--accent-primary)_12%,var(--surface-2))] text-primary shadow-[var(--shadow-soft)]"
          : "border-[color:var(--border-soft)] bg-[color:var(--surface-3)] text-secondary hover:border-[color:var(--border-color)] hover:bg-[color:var(--surface-2)]"
         }`}
        >
         <div className="flex items-center justify-between gap-3">
          <span className="truncate text-sm font-semibold">{project.name}</span>
          <span className="token-pill px-2 py-1 text-[10px] uppercase tracking-[0.12em]">
           {project.members?.length || 1}
          </span>
         </div>
         <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
          {project.description || "No description added yet."}
         </p>
        </button>
       </li>
      )
     })}
    </ul>
   </div>
  </aside>
 )
}

export default Sidebar
