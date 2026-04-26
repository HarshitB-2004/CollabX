import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
 FiArrowLeft,
 FiCalendar,
 FiEdit3,
 FiFlag,
 FiLayers,
 FiPlus,
 FiTrash2,
 FiUser,
} from "react-icons/fi"
import API from "../services/api"
import ThemeToggle from "../components/ThemeToggle"
import LogoutButton from "../components/LogoutButton"
import IconDeleteButton from "../components/IconDeleteButton"

const defaultForm = {
 title: "",
 description: "",
 assignedTo: "",
 dueDate: "",
 priority: "medium",
 status: "todo",
}

const columns = [
 { key: "todo", title: "To Do" },
 { key: "in-progress", title: "In Progress" },
 { key: "completed", title: "Completed" },
]

const formatDate = (value) => {
 if (!value) return "No due date"

 return new Date(value).toLocaleDateString([], {
  day: "numeric",
  month: "short",
  year: "numeric",
 })
}

const getDeadlineAccent = (dueDate) => {
 if (!dueDate) {
  return {
   dotClass: "bg-slate-400/70",
   label: "Flexible",
   cardStyle: {},
  }
 }

 const now = new Date()
 const due = new Date(dueDate)
 const diffMs = due.getTime() - now.getTime()
 const diffHours = diffMs / (1000 * 60 * 60)

 if (diffMs < 0) {
  return {
   dotClass: "bg-rose-500",
   label: "Overdue",
   cardStyle: {
    borderColor: "rgba(244, 63, 94, 0.24)",
    background:
     "linear-gradient(180deg, rgba(244, 63, 94, 0.1), color-mix(in srgb, var(--surface-2) 96%, transparent))",
   },
  }
 }

 if (diffHours <= 24) {
  return {
   dotClass: "bg-rose-400",
   label: "Urgent",
   cardStyle: {
    borderColor: "rgba(251, 113, 133, 0.22)",
    background:
     "linear-gradient(180deg, rgba(251, 113, 133, 0.08), color-mix(in srgb, var(--surface-2) 96%, transparent))",
   },
  }
 }

 if (diffHours <= 72) {
  return {
   dotClass: "bg-amber-400",
   label: "Due soon",
   cardStyle: {
    borderColor: "rgba(251, 191, 36, 0.2)",
    background:
     "linear-gradient(180deg, rgba(251, 191, 36, 0.08), color-mix(in srgb, var(--surface-2) 96%, transparent))",
   },
  }
 }

 return {
  dotClass: "bg-emerald-400",
  label: "On track",
  cardStyle: {
   borderColor: "rgba(52, 211, 153, 0.18)",
   background:
    "linear-gradient(180deg, rgba(52, 211, 153, 0.06), color-mix(in srgb, var(--surface-2) 96%, transparent))",
  },
 }
}

const Tasks = () => {
 const navigate = useNavigate()
 const [projects, setProjects] = useState([])
 const [selectedProjectId, setSelectedProjectId] = useState("")
 const [tasks, setTasks] = useState([])
 const [formOpen, setFormOpen] = useState(false)
 const [saving, setSaving] = useState(false)
 const [deleting, setDeleting] = useState(false)
 const [editingTaskId, setEditingTaskId] = useState(null)
 const [taskForm, setTaskForm] = useState(defaultForm)

 const selectedProject = useMemo(
  () => projects.find((project) => project._id === selectedProjectId) || null,
  [projects, selectedProjectId]
 )

 const fetchProjects = async () => {
  try {
   const res = await API.get("/projects/my-projects")
   setProjects(res.data)

   const savedProjectId = localStorage.getItem("activeProjectId")
   const initialProjectId =
    res.data.find((project) => project._id === savedProjectId)?._id || res.data[0]?._id || ""

   setSelectedProjectId((current) => current || initialProjectId)
  } catch (err) {
   console.log(err)
  }
 }

 const fetchTasks = async (projectId) => {
  if (!projectId) {
   setTasks([])
   return
  }

  try {
   const res = await API.get(`/tasks/project/${projectId}`)
   setTasks(res.data)
  } catch (err) {
   console.log(err)
  }
 }

 useEffect(() => {
  fetchProjects()
 }, [])

 useEffect(() => {
  if (!selectedProjectId) return

  localStorage.setItem("activeProjectId", selectedProjectId)
  fetchTasks(selectedProjectId)
 }, [selectedProjectId])

 const handleDragStart = (e, taskId) => {
  e.dataTransfer.setData("taskId", taskId)
 }

 const handleDrop = async (e, status) => {
  const taskId = e.dataTransfer.getData("taskId")

  try {
   await API.put("/tasks/status", { taskId, status })
   fetchTasks(selectedProjectId)
  } catch (err) {
   console.log(err)
  }
 }

 const allowDrop = (e) => {
  e.preventDefault()
 }

 const openCreateModal = () => {
  setEditingTaskId(null)
  setTaskForm(defaultForm)
  setFormOpen(true)
 }

 const openEditModal = (task) => {
  setEditingTaskId(task._id)
  setTaskForm({
   title: task.title || "",
   description: task.description || "",
   assignedTo: task.assignedTo?._id || "",
   dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
   priority: task.priority || "medium",
   status: task.status || "todo",
  })
  setFormOpen(true)
 }

 const closeModal = () => {
  setFormOpen(false)
  setEditingTaskId(null)
  setDeleting(false)
  setTaskForm(defaultForm)
 }

 const submitTask = async (e) => {
  e.preventDefault()

  if (!selectedProjectId || !taskForm.title.trim()) return

  setSaving(true)

  try {
   const payload = {
    ...taskForm,
    title: taskForm.title.trim(),
    description: taskForm.description.trim(),
    projectId: selectedProjectId,
   }

   if (editingTaskId) {
    await API.put(`/tasks/${editingTaskId}`, payload)
   } else {
    await API.post("/tasks/create", payload)
   }

   closeModal()
   fetchTasks(selectedProjectId)
  } catch (err) {
   console.log(err)
  } finally {
   setSaving(false)
  }
 }

 const handleDeleteTask = async () => {
  if (!editingTaskId) return

  setDeleting(true)

  try {
   await API.delete(`/tasks/${editingTaskId}`)
   closeModal()
   fetchTasks(selectedProjectId)
  } catch (err) {
   console.log(err)
  } finally {
   setDeleting(false)
  }
 }

 const deleteTaskFromCard = async (taskId, taskTitle) => {
  const confirmed = window.confirm(`Delete task "${taskTitle}"?`)

  if (!confirmed) return

  try {
   await API.delete(`/tasks/${taskId}`)
   fetchTasks(selectedProjectId)
  } catch (err) {
   console.log(err)
  }
 }

 return (
  <div className="page-shell px-4 py-4 md:px-6">
   <div className="glass-shell mx-auto min-h-[calc(100vh-2rem)] max-w-[1600px] rounded-[28px] p-6 md:p-8">
    <div className="mb-8 flex flex-col gap-4 border-b border-[color:var(--border-color)] pb-6 xl:flex-row xl:items-center xl:justify-between">
     <div>
      <p className="eyebrow text-xs font-semibold uppercase tracking-[0.32em]">
       Execution Board
      </p>
      <h1 className="mt-2 text-3xl font-bold text-primary">Task management</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">
       Manage project delivery with member assignment, realistic priorities, and cleaner workflow updates.
      </p>
     </div>

     <div className="flex flex-wrap items-center gap-3">
      <button
       onClick={() => navigate("/dashboard")}
       className="btn-ghost px-4 py-3 text-sm"
      >
       <FiArrowLeft />
       Back to workspace
      </button>

      <select
       value={selectedProjectId}
       onChange={(e) => setSelectedProjectId(e.target.value)}
       className="soft-select rounded-full px-4 py-3 text-sm font-semibold"
      >
       {projects.map((project) => (
        <option key={project._id} value={project._id} className="bg-slate-900">
         {project.name}
        </option>
       ))}
      </select>

      <button
       onClick={openCreateModal}
       disabled={!selectedProjectId}
       className="btn-primary px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
       <FiPlus />
       Add task
      </button>

      <ThemeToggle />
      <LogoutButton />
     </div>
    </div>

    {selectedProject ? (
     <>
      <div className="mb-6 grid gap-4 lg:grid-cols-4">
       <div className="stat-card rounded-[24px] p-5">
        <p className="text-sm text-secondary">Selected workspace</p>
        <p className="mt-3 text-xl font-bold text-primary">{selectedProject.name}</p>
       </div>
       <div className="stat-card rounded-[24px] p-5">
        <p className="text-sm text-secondary">Members</p>
        <p className="mt-3 text-xl font-bold text-primary">{selectedProject.members?.length || 0}</p>
       </div>
       <div className="stat-card rounded-[24px] p-5">
        <p className="text-sm text-secondary">Assigned tasks</p>
        <p className="mt-3 text-xl font-bold text-primary">
         {tasks.filter((task) => task.assignedTo?._id).length}
        </p>
       </div>
       <div className="stat-card rounded-[24px] p-5">
        <p className="text-sm text-secondary">Completed</p>
        <p className="mt-3 text-xl font-bold text-primary">
         {tasks.filter((task) => task.status === "completed").length}
        </p>
       </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
       {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.key)

        return (
         <div
          key={column.key}
          onDragOver={allowDrop}
          onDrop={(e) => handleDrop(e, column.key)}
          className="rounded-[28px] border p-5 shadow-[var(--shadow-soft)]"
          style={{
           minHeight: "520px",
           borderColor: "var(--border-color)",
           background:
            "linear-gradient(180deg, color-mix(in srgb, var(--surface-2) 76%, transparent), color-mix(in srgb, var(--surface-3) 96%, transparent))",
          }}
         >
          <div className="mb-5 flex items-center justify-between">
           <div>
            <h2 className="text-lg font-bold text-primary">{column.title}</h2>
            <p className="mt-1 text-sm text-secondary">
             {columnTasks.length} {columnTasks.length === 1 ? "task" : "tasks"}
            </p>
           </div>
           <span className="token-pill">{column.key}</span>
          </div>

          <div className="space-y-3">
           {columnTasks.length > 0 ? (
           columnTasks.map((task) => (
             (() => {
              const deadlineAccent = getDeadlineAccent(task.dueDate)

              return (
             <div
              key={task._id}
              draggable
              onDragStart={(e) => handleDragStart(e, task._id)}
              onClick={() => openEditModal(task)}
              className="cursor-pointer rounded-[24px] border px-4 py-4 shadow-[var(--shadow-soft)] transition hover:translate-y-[-2px]"
              style={deadlineAccent.cardStyle}
             >
             <div className="flex items-start justify-between gap-3">
               <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-primary">{task.title}</p>
               </div>
               <div className="flex items-center gap-2">
                <span className="token-pill border-[color:var(--border-soft)] bg-[color:var(--surface-2)] text-[var(--text-secondary)]">
                 {task.priority}
                </span>
                <IconDeleteButton
                 title={`Delete ${task.title}`}
                 onClick={(e) => {
                  e.stopPropagation()
                  deleteTaskFromCard(task._id, task.title)
                 }}
                />
               </div>
              </div>

              <p className="mt-2 text-sm leading-6 text-secondary">
               {task.description || "No task description yet."}
              </p>

              <div className="mt-4 flex flex-wrap gap-3 text-xs text-secondary">
               <span className="token-pill">
                <FiUser size={12} />
                {task.assignedTo?.name || "Unassigned"}
               </span>
               <span className="token-pill">
                <span className={`h-2 w-2 rounded-full ${deadlineAccent.dotClass}`}></span>
                <FiCalendar size={12} />
                {formatDate(task.dueDate)}
               </span>
               <span className="token-pill">
                <span className={`h-2 w-2 rounded-full ${deadlineAccent.dotClass}`}></span>
                {deadlineAccent.label}
               </span>
               <span className="token-pill">
                <FiFlag size={12} />
                {task.priority}
               </span>
               <span className="token-pill">
                <FiEdit3 size={12} />
                Edit
               </span>
              </div>
             </div>
            )})()
            ))
           ) : (
            <div className="glass-subtle rounded-[24px] border-dashed px-5 py-10 text-center">
             <p className="text-sm font-semibold text-primary">Nothing here yet</p>
             <p className="mt-2 text-sm leading-6 text-secondary">
              Drag a task into this stage or create a new one to fill the board.
             </p>
            </div>
           )}
          </div>
         </div>
        )
       })}
      </div>
     </>
    ) : (
     <div className="glass-subtle rounded-[28px] border-dashed px-6 py-16 text-center text-secondary">
      <div className="mx-auto max-w-xl">
       <FiLayers className="mx-auto text-[var(--accent-primary)]" size={28} />
       <p className="mt-4 text-lg font-semibold text-primary">No workspace selected</p>
       <p className="mt-2 text-sm leading-6 text-secondary">
        Create or choose a workspace first so we know which team tasks to load.
       </p>
      </div>
     </div>
    )}
   </div>

   {formOpen && selectedProject && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
     <div className="glass-shell w-full max-w-2xl rounded-[28px] p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
       <div>
        <p className="eyebrow text-xs font-semibold uppercase tracking-[0.28em]">
         {editingTaskId ? "Edit Task" : "New Task"}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-primary">
         {editingTaskId ? "Update task details and assignment" : `Create a task for ${selectedProject.name}`}
        </h2>
       </div>
       <button onClick={closeModal} className="btn-ghost px-4 py-2 text-sm">
        Close
       </button>
      </div>

      <form onSubmit={submitTask} className="space-y-4">
       <input
        value={taskForm.title}
        onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
        placeholder="Task title"
        className="soft-input"
       />

       <textarea
        value={taskForm.description}
        onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
        placeholder="Task description"
        rows={4}
        className="soft-textarea"
       />

       <div className="grid gap-4 md:grid-cols-2">
        <select
         value={taskForm.status}
         onChange={(e) => setTaskForm((prev) => ({ ...prev, status: e.target.value }))}
         className="soft-select"
        >
         {["todo", "in-progress", "completed"].map((status) => (
          <option key={status} value={status} className="bg-slate-900">
           {status}
          </option>
         ))}
        </select>

        <select
         value={taskForm.assignedTo}
         onChange={(e) => setTaskForm((prev) => ({ ...prev, assignedTo: e.target.value }))}
         className="soft-select"
        >
         <option value="" className="bg-slate-900">
          Unassigned
         </option>
         {selectedProject.members?.map((member) => (
          <option key={member._id} value={member._id} className="bg-slate-900">
           {member.name}
          </option>
         ))}
        </select>
       </div>

       <div className="grid gap-4 md:grid-cols-2">
        <select
         value={taskForm.priority}
         onChange={(e) => setTaskForm((prev) => ({ ...prev, priority: e.target.value }))}
         className="soft-select"
        >
         {["low", "medium", "high", "urgent"].map((priority) => (
          <option key={priority} value={priority} className="bg-slate-900">
           {priority}
          </option>
         ))}
        </select>

        <input
         type="date"
         value={taskForm.dueDate}
         onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))}
         className="soft-input"
        />
       </div>

       <div className="flex justify-between gap-3 pt-2">
        <div>
         {editingTaskId && (
          <button
           type="button"
           onClick={handleDeleteTask}
           disabled={deleting}
           className="btn-danger px-4 py-3 text-sm disabled:opacity-60"
          >
           <FiTrash2 />
           {deleting ? "Deleting..." : "Delete"}
          </button>
         )}
        </div>

        <div className="flex gap-3">
         <button type="button" onClick={closeModal} className="btn-ghost px-4 py-3 text-sm">
          Cancel
         </button>
         <button
          type="submit"
          disabled={saving}
          className="btn-primary px-5 py-3 text-sm disabled:opacity-60"
         >
          {saving ? "Saving..." : editingTaskId ? "Save changes" : "Create task"}
         </button>
        </div>
       </div>
      </form>
     </div>
    </div>
   )}
  </div>
 )
}

export default Tasks
