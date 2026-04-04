import { useState } from "react"
import Sidebar from "../components/Sidebar"
import ChannelList from "../components/ChannelList"
import ChatWindow from "../components/ChatWindow"
import { useNavigate } from "react-router-dom"
import {
 FiCheckSquare,
 FiChevronLeft,
 FiChevronRight,
 FiGrid,
 FiMenu,
 FiMessageSquare,
 FiUsers,
} from "react-icons/fi"

const Dashboard = () => {
 const [selectedProject, setSelectedProject] = useState(null)
 const [selectedChannel, setSelectedChannel] = useState(null)
 const [workspaceOpen, setWorkspaceOpen] = useState(true)
 const [channelsOpen, setChannelsOpen] = useState(true)
 const navigate = useNavigate()

  return (
  <div className="page-shell h-screen overflow-hidden px-3 py-3 md:px-4 md:py-4">
   <div className="glass-shell flex h-full flex-col overflow-hidden rounded-[28px]">
    <div className="flex flex-col gap-4 border-b border-[color:var(--border-color)] px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
     <div className="flex items-start gap-3">
      <button
       onClick={() => setWorkspaceOpen((current) => !current)}
       className="btn-ghost h-11 w-11 shrink-0 rounded-2xl p-0"
       title={workspaceOpen ? "Hide workspaces" : "Show workspaces"}
      >
       <FiMenu />
      </button>

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
     </div>

     <div className="flex flex-wrap items-center gap-2">
      <button
       onClick={() => setChannelsOpen((current) => !current)}
       className="btn-ghost px-4 py-2.5 text-sm"
      >
       {channelsOpen ? <FiChevronLeft /> : <FiChevronRight />}
       Channels
      </button>

      <button
       onClick={() => navigate("/people")}
       className="btn-ghost px-4 py-2.5 text-sm"
      >
       <FiUsers />
       People
      </button>

      <button
       onClick={() => navigate("/overview")}
       className="btn-ghost px-4 py-2.5 text-sm"
      >
       <FiGrid />
       Overview
      </button>

      <button
       onClick={() => navigate("/tasks")}
       className="btn-secondary px-4 py-2.5 text-sm"
      >
       <FiCheckSquare />
       Tasks
      </button>
     </div>
    </div>

    <div className="flex items-center gap-2 border-b border-[color:var(--border-color)] px-4 py-3 sm:px-5 lg:hidden">
     <button
      onClick={() => setWorkspaceOpen((current) => !current)}
      className="btn-ghost px-4 py-2 text-sm"
     >
      <FiMenu />
      Workspaces
     </button>
     <button
      onClick={() => setChannelsOpen((current) => !current)}
      className="btn-ghost px-4 py-2 text-sm"
     >
      <FiMessageSquare />
      Channels
     </button>
    </div>

    <div className="dashboard-layout min-h-0 flex-1">
     {workspaceOpen ? (
      <Sidebar
       selectedProject={selectedProject}
       setSelectedProject={setSelectedProject}
       setSelectedChannel={setSelectedChannel}
      />
     ) : null}

     {channelsOpen ? (
      <ChannelList
       selectedProject={selectedProject}
       selectedChannel={selectedChannel}
       setSelectedChannel={setSelectedChannel}
      />
     ) : null}

     <ChatWindow
      selectedChannel={selectedChannel}
      selectedProject={selectedProject}
      workspaceOpen={workspaceOpen}
      channelsOpen={channelsOpen}
     />
    </div>
   </div>
  </div>
 )
}

export default Dashboard
