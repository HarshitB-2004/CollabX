import { useEffect, useState } from "react"
import API from "../services/api"
import { FiHash, FiMessageSquare, FiPlus } from "react-icons/fi"

const ChannelList = ({ selectedProject, selectedChannel, setSelectedChannel }) => {
 const [channels, setChannels] = useState([])

 const fetchChannels = async () => {
  if(!selectedProject) return

  const res = await API.get(
   `/channels/project/${selectedProject._id}`
  )

  setChannels(res.data)

  if (!selectedChannel && res.data[0]) {
   setSelectedChannel(res.data[0])
  }

 }

 useEffect(() => {
  let cancelled = false

  const loadChannels = async () => {
   if (!selectedProject) {
    queueMicrotask(() => {
     if (!cancelled) {
      setChannels([])
     }
    })
    return
   }

   const res = await API.get(`/channels/project/${selectedProject._id}`)

   if (cancelled) return

   setChannels(res.data)

   if (!selectedChannel && res.data[0]) {
    setSelectedChannel(res.data[0])
   }
  }

  loadChannels()

  return () => {
   cancelled = true
  }
 }, [selectedProject, selectedChannel, setSelectedChannel])

 const createChannel = async () => {
  if(!selectedProject){
   alert("Select a project first")
   return
  }

  const name = prompt("Enter Channel Name")

  if(!name?.trim()){
   alert("Channel name is required")
   return
  }

  try {
   await API.post("/channels/create", {
    name: name.trim(),
    projectId: selectedProject._id
   })

   fetchChannels()
  } catch (err) {
   console.log(err)
  }
 }

 return (
  <aside className="channel-sidebar flex h-full min-h-0 flex-col border-r border-[color:var(--border-soft)] bg-[color:color-mix(in_srgb,var(--surface-1)_96%,transparent)] px-4 py-4">
   <div className="mb-4 flex items-center justify-between gap-3">
    <div>
     <p className="eyebrow text-[11px] font-semibold uppercase tracking-[0.22em]">
      Channels
     </p>
     <h2 className="mt-1 text-lg font-semibold text-primary">Browse</h2>
    </div>
    <div className="glass-subtle rounded-2xl p-2.5 text-[var(--accent-secondary)]">
     <FiMessageSquare />
    </div>
   </div>

   <div className="glass-subtle mb-4 rounded-2xl px-4 py-3">
    <p className="text-sm font-semibold text-primary">
     {selectedProject ? selectedProject.name : "No project selected"}
    </p>
    <p className="mt-1 text-xs leading-5 text-secondary">
     {selectedProject
      ? "Choose a conversation space."
      : "Choose a workspace first."}
    </p>
   </div>

   <button
    onClick={createChannel}
    disabled={!selectedProject}
    className="btn-ghost mb-4 rounded-2xl px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
   >
    <FiPlus />
    New Channel
   </button>

   <div className="min-h-0 flex-1 overflow-y-auto pr-1">
    {channels.length > 0 ? (
     <ul className="space-y-2">
      {channels.map((channel) => {
       const isActive = selectedChannel?._id === channel._id

       return (
        <li key={channel._id}>
         <button
          onClick={() => setSelectedChannel(channel)}
          className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
           isActive
            ? "accent-ring bg-[color:color-mix(in_srgb,var(--accent-secondary)_12%,var(--surface-2))] text-primary shadow-[var(--shadow-soft)]"
            : "border-[color:var(--border-soft)] bg-[color:var(--surface-3)] text-secondary hover:border-[color:var(--border-color)] hover:bg-[color:var(--surface-2)]"
          }`}
         >
          <span className="glass-subtle rounded-xl p-2 text-primary">
           <FiHash size={14} />
          </span>
          <div className="min-w-0">
           <p className="truncate text-sm font-semibold">{channel.name}</p>
           <p className="text-xs text-muted">Messages</p>
          </div>
         </button>
        </li>
       )
      })}
     </ul>
    ) : (
     <div className="glass-subtle rounded-3xl border-dashed px-5 py-10 text-center">
      <p className="text-sm font-semibold text-primary">No channels yet</p>
      <p className="mt-2 text-sm leading-6 text-secondary">
       Create your first channel to separate conversations by team, feature, or topic.
      </p>
     </div>
    )}
   </div>
  </aside>
 )
}

export default ChannelList
