import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
 FiArrowLeft,
 FiCheck,
 FiSearch,
 FiUserPlus,
 FiUsers,
 FiX,
} from "react-icons/fi"
import API from "../services/api"
import ThemeToggle from "../components/ThemeToggle"
import LogoutButton from "../components/LogoutButton"

const People = () => {
 const navigate = useNavigate()
 const [projects, setProjects] = useState([])
 const [selectedProjectId, setSelectedProjectId] = useState("")
 const [friendSummary, setFriendSummary] = useState({
  incoming: [],
  outgoing: [],
  friends: [],
 })
 const [searchTerm, setSearchTerm] = useState("")
 const [searchResults, setSearchResults] = useState([])
 const [loadingSearch, setLoadingSearch] = useState(false)
 const [actionMessage, setActionMessage] = useState("")

 const selectedProject = useMemo(
  () => projects.find((project) => project._id === selectedProjectId) || null,
  [projects, selectedProjectId]
 )

 const selectedMemberIds = useMemo(
  () => new Set((selectedProject?.members || []).map((member) => member._id)),
  [selectedProject]
 )

 const loadProjects = async () => {
  const res = await API.get("/projects/my-projects")
  setProjects(res.data)
  setSelectedProjectId((current) => current || res.data[0]?._id || "")
 }

 const loadFriendSummary = async () => {
  const res = await API.get("/friends")
  setFriendSummary(res.data)
 }

 useEffect(() => {
  const load = async () => {
   try {
    await Promise.all([loadProjects(), loadFriendSummary()])
   } catch (err) {
    console.log(err)
   }
  }

  load()
 }, [])

 useEffect(() => {
  const fetchUsers = async () => {
   if (!searchTerm.trim()) {
    setSearchResults([])
    return
   }

   setLoadingSearch(true)
   try {
    const res = await API.get(`/users/search?q=${encodeURIComponent(searchTerm.trim())}`)
    setSearchResults(res.data)
   } catch (err) {
    console.log(err)
   } finally {
    setLoadingSearch(false)
   }
  }

  const timeout = setTimeout(fetchUsers, 250)
  return () => clearTimeout(timeout)
 }, [searchTerm])

 const setFeedback = (message) => {
  setActionMessage(message)
  window.clearTimeout(window.__peopleMessageTimeout)
  window.__peopleMessageTimeout = window.setTimeout(() => setActionMessage(""), 2200)
 }

 const sendFriendRequest = async (recipientId) => {
  try {
   await API.post("/friends/request", { recipientId })
   setFeedback("Friend request sent")
   loadFriendSummary()
  } catch (err) {
   setFeedback(err.response?.data?.message || "Could not send request")
  }
 }

 const respondToRequest = async (requestId, action) => {
  try {
   await API.put(`/friends/${requestId}/${action}`)
   setFeedback(action === "accept" ? "Friend request accepted" : "Friend request rejected")
   loadFriendSummary()
  } catch {
   setFeedback("Could not update request")
  }
 }

 const addFriendToProject = async (userId) => {
  if (!selectedProjectId) {
   setFeedback("Select a workspace first")
   return
  }

  try {
   const res = await API.post("/projects/add-member", {
    projectId: selectedProjectId,
    userId,
   })

   setProjects((prev) =>
    prev.map((project) => (project._id === res.data._id ? res.data : project))
   )
   setFeedback("Member added to workspace")
  } catch (err) {
   setFeedback(err.response?.data?.message || "Could not add member")
  }
 }

 const pendingRequestIds = new Set(friendSummary.outgoing.map((request) => request.recipient._id))
 const incomingRequestIds = new Set(friendSummary.incoming.map((request) => request.requester._id))
 const friendIds = new Set(friendSummary.friends.map((entry) => entry.friend._id))

 return (
  <div className="page-shell px-4 py-4 md:px-6">
   <div className="glass-shell mx-auto min-h-[calc(100vh-2rem)] max-w-[1600px] rounded-[28px] p-6 md:p-8">
    <div className="mb-8 flex flex-col gap-4 border-b border-[color:var(--border-color)] pb-6 xl:flex-row xl:items-center xl:justify-between">
     <div>
      <p className="eyebrow text-xs font-semibold uppercase tracking-[0.32em]">People Hub</p>
      <h1 className="mt-2 text-3xl font-bold text-primary">Friends and workspace members</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">
       Search for people, send friend requests, accept invitations, and add friends into your active workspace.
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
        <option key={project._id} value={project._id}>
         {project.name}
        </option>
       ))}
      </select>

      <ThemeToggle />
      <LogoutButton />
     </div>
    </div>

    {actionMessage && (
     <div className="mb-6 token-pill border-[color:color-mix(in_srgb,var(--accent-primary)_26%,var(--border-color))] bg-[color:color-mix(in_srgb,var(--accent-primary)_10%,var(--surface-2))] text-[var(--accent-primary)]">
      {actionMessage}
     </div>
    )}

    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
     <section className="glass-panel rounded-[28px] p-6">
      <div className="flex items-center gap-3">
       <div className="glass-subtle rounded-2xl p-3 text-[var(--accent-primary)]">
        <FiSearch />
       </div>
       <div>
        <p className="eyebrow text-xs font-semibold uppercase tracking-[0.28em]">
         Find people
        </p>
        <h2 className="mt-1 text-xl font-bold text-primary">Search by name or email</h2>
       </div>
      </div>

      <div className="mt-5">
       <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search teammates"
        className="soft-input"
       />
      </div>

      <div className="mt-5 space-y-3">
       {loadingSearch ? (
        <div className="glass-subtle rounded-[24px] px-5 py-6 text-secondary">Searching...</div>
       ) : searchResults.length > 0 ? (
        searchResults.map((user) => {
         const isFriend = friendIds.has(user._id)
         const hasPending = pendingRequestIds.has(user._id)
         const hasIncoming = incomingRequestIds.has(user._id)

         return (
          <div key={user._id} className="stat-card rounded-[24px] px-5 py-4">
           <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
             <p className="text-sm font-semibold text-primary">{user.name}</p>
             <p className="mt-1 text-sm text-secondary">{user.email}</p>
            </div>

            {isFriend ? (
             <span className="token-pill border-[color:color-mix(in_srgb,var(--accent-success)_24%,var(--border-color))] bg-[color:color-mix(in_srgb,var(--accent-success)_10%,var(--surface-2))] text-[var(--accent-success)]">
              Friends
             </span>
            ) : hasPending ? (
             <span className="token-pill">Request sent</span>
            ) : hasIncoming ? (
             <span className="token-pill">Incoming request</span>
            ) : (
             <button
              onClick={() => sendFriendRequest(user._id)}
              className="btn-secondary px-4 py-2 text-sm"
             >
              <FiUserPlus />
              Add friend
             </button>
            )}
           </div>
          </div>
         )
        })
       ) : (
        <div className="glass-subtle rounded-[24px] px-5 py-10 text-center">
         <p className="text-sm font-semibold text-primary">Search for teammates</p>
         <p className="mt-2 text-sm text-secondary">
          Results will appear here so you can send friend requests.
         </p>
        </div>
       )}
      </div>
     </section>

     <section className="space-y-6">
      <div className="glass-panel rounded-[28px] p-6">
       <div className="flex items-center justify-between gap-3">
        <div>
         <p className="eyebrow text-xs font-semibold uppercase tracking-[0.28em]">
          Incoming requests
         </p>
         <h2 className="mt-1 text-xl font-bold text-primary">People who want to connect</h2>
        </div>
        <span className="token-pill">{friendSummary.incoming.length} pending</span>
       </div>

       <div className="mt-5 space-y-3">
        {friendSummary.incoming.length > 0 ? (
         friendSummary.incoming.map((request) => (
          <div key={request._id} className="stat-card rounded-[22px] px-4 py-4">
           <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
             <p className="text-sm font-semibold text-primary">{request.requester.name}</p>
             <p className="mt-1 text-sm text-secondary">{request.requester.email}</p>
            </div>
            <div className="flex gap-2">
             <button
              onClick={() => respondToRequest(request._id, "accept")}
              className="btn-primary px-4 py-2 text-sm"
             >
              <FiCheck />
              Accept
             </button>
             <button
              onClick={() => respondToRequest(request._id, "reject")}
              className="btn-danger px-4 py-2 text-sm"
             >
              <FiX />
              Reject
             </button>
            </div>
           </div>
          </div>
         ))
        ) : (
         <div className="glass-subtle rounded-[22px] px-5 py-8 text-center text-secondary">
          No incoming requests right now.
         </div>
        )}
       </div>
      </div>

      <div className="glass-panel rounded-[28px] p-6">
       <div className="flex items-center justify-between gap-3">
        <div>
         <p className="eyebrow text-xs font-semibold uppercase tracking-[0.28em]">
          Friends
         </p>
         <h2 className="mt-1 text-xl font-bold text-primary">Your network</h2>
        </div>
        <span className="token-pill">{friendSummary.friends.length} friends</span>
       </div>

       <div className="mt-5 space-y-3">
        {friendSummary.friends.length > 0 ? (
         friendSummary.friends.map(({ _id, friend }) => {
          const alreadyMember = selectedMemberIds.has(friend._id)

          return (
           <div key={_id} className="stat-card rounded-[22px] px-4 py-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
             <div>
              <p className="text-sm font-semibold text-primary">{friend.name}</p>
              <p className="mt-1 text-sm text-secondary">{friend.email}</p>
             </div>
             <div className="flex items-center gap-2">
              {alreadyMember ? (
               <span className="token-pill border-[color:color-mix(in_srgb,var(--accent-success)_24%,var(--border-color))] bg-[color:color-mix(in_srgb,var(--accent-success)_10%,var(--surface-2))] text-[var(--accent-success)]">
                In workspace
               </span>
              ) : (
               <button
                onClick={() => addFriendToProject(friend._id)}
                className="btn-secondary px-4 py-2 text-sm"
               >
                <FiUsers />
                Add to workspace
               </button>
              )}
             </div>
            </div>
           </div>
          )
         })
        ) : (
         <div className="glass-subtle rounded-[22px] px-5 py-8 text-center text-secondary">
          Add some friends first, then you can invite them into the selected workspace.
         </div>
        )}
       </div>
      </div>

      <div className="glass-panel rounded-[28px] p-6">
       <div className="flex items-center justify-between gap-3">
        <div>
         <p className="eyebrow text-xs font-semibold uppercase tracking-[0.28em]">
          Outgoing requests
         </p>
         <h2 className="mt-1 text-xl font-bold text-primary">Waiting for replies</h2>
        </div>
        <span className="token-pill">{friendSummary.outgoing.length} sent</span>
       </div>

       <div className="mt-5 space-y-3">
        {friendSummary.outgoing.length > 0 ? (
         friendSummary.outgoing.map((request) => (
          <div key={request._id} className="stat-card rounded-[22px] px-4 py-4">
           <p className="text-sm font-semibold text-primary">{request.recipient.name}</p>
           <p className="mt-1 text-sm text-secondary">{request.recipient.email}</p>
          </div>
         ))
        ) : (
         <div className="glass-subtle rounded-[22px] px-5 py-8 text-center text-secondary">
          No pending outgoing requests.
         </div>
        )}
       </div>
      </div>
     </section>
    </div>
   </div>
  </div>
 )
}

export default People
