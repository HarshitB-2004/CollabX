import { useEffect, useRef, useState } from "react"
import {
 FiBookmark,
 FiCheck,
 FiEdit2,
 FiExternalLink,
 FiFileText,
 FiSend,
 FiTrash2,
 FiUsers,
 FiX,
 FiZap,
} from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import API, { FILE_BASE_URL } from "../services/api"
import VoiceHuddle from "./VoiceHuddle"
import { socket } from "../socket/socket"

const AttachmentButtonIcon = () => (
 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path
   d="M12 6v12M6 12h12"
   stroke="currentColor"
   strokeWidth="1.8"
   strokeLinecap="round"
   strokeLinejoin="round"
  />
 </svg>
)

const getAttachmentUrl = (fileUrl = "") =>
 fileUrl.startsWith("http") ? fileUrl : `${FILE_BASE_URL}${fileUrl}`

const renderAttachment = (attachment) => {
 if (!attachment?.fileUrl) return null

 const src = getAttachmentUrl(attachment.fileUrl)

 if (attachment.kind === "image") {
  return <img src={src} alt={attachment.fileName} className="mt-3 max-h-72 rounded-2xl object-cover" />
 }

 if (attachment.kind === "video") {
  return <video src={src} controls className="mt-3 max-h-72 rounded-2xl" />
 }

 if (attachment.kind === "audio") {
  return <audio src={src} controls className="mt-3 w-full" />
 }

 return (
  <a
   href={src}
   target="_blank"
   rel="noreferrer"
   className="mt-3 inline-flex max-w-full items-center rounded-2xl border border-[color:var(--border-color)] px-3 py-2 text-xs font-semibold underline"
  >
   {attachment.fileName}
  </a>
 )
}

const reportUiError = (action, err) => {
 console.error(`[ChatWindow] ${action}`, {
  message: err?.message,
  responseMessage: err?.response?.data?.message,
  status: err?.response?.status,
  data: err?.response?.data,
 })
}

const ChatWindow = ({ selectedChannel, selectedProject }) => {
 const [messages, setMessages] = useState([])
 const [text, setText] = useState("")
 const [aiMenuOpen, setAiMenuOpen] = useState(false)
 const [aiLoading, setAiLoading] = useState(false)
 const [aiSaving, setAiSaving] = useState(false)
 const [aiTone, setAiTone] = useState("professional")
 const [aiOutput, setAiOutput] = useState("")
 const [aiOutputTitle, setAiOutputTitle] = useState("")
 const [aiOutputType, setAiOutputType] = useState("")
 const [aiSaveName, setAiSaveName] = useState("")
 const [aiItems, setAiItems] = useState([])
 const [uploading, setUploading] = useState(false)
 const [feedback, setFeedback] = useState("")
 const [editingMessageId, setEditingMessageId] = useState(null)
 const [editingText, setEditingText] = useState("")
 const bottomRef = useRef(null)
 const fileInputRef = useRef(null)
 const navigate = useNavigate()

 const user = JSON.parse(localStorage.getItem("user"))
 const currentUserId = user?.id || user?._id

 const replaceMessage = (nextMessage) => {
  setMessages((prev) =>
   prev.map((message) => (message._id === nextMessage._id ? nextMessage : message))
  )
 }

 const resetAiOutput = () => {
  setAiOutput("")
  setAiOutputTitle("")
  setAiOutputType("")
  setAiSaveName("")
  setAiItems([])
 }

 const fetchMessages = async () => {
  if (!selectedChannel) return

  const res = await API.get(`/messages/${selectedChannel._id}`)
  setMessages(res.data)
 }

 useEffect(() => {
  if (!selectedChannel) {
   setMessages([])
   resetAiOutput()
   return
  }

  socket.emit("joinChannel", selectedChannel._id)
  fetchMessages()
 }, [selectedChannel])

 useEffect(() => {
  const handleMessage = (message) => {
   setMessages((prev) => [...prev, message])
  }

  const handleUpdatedMessage = (message) => {
   replaceMessage(message)
  }

  socket.on("receiveMessage", handleMessage)
  socket.on("messageUpdated", handleUpdatedMessage)
  socket.on("messageDeleted", handleUpdatedMessage)

  return () => {
   socket.off("receiveMessage", handleMessage)
   socket.off("messageUpdated", handleUpdatedMessage)
   socket.off("messageDeleted", handleUpdatedMessage)
  }
 }, [])

 const sendMessage = () => {
  const trimmed = text.trim()

  if (!trimmed || !selectedChannel) return

  socket.emit("sendMessage", {
   channelId: selectedChannel._id,
   senderId: currentUserId,
   text: trimmed,
  })

  setText("")
 }

 const startEditing = (message) => {
  setEditingMessageId(message._id)
  setEditingText(message.text || "")
 }

 const cancelEditing = () => {
  setEditingMessageId(null)
  setEditingText("")
 }

 const saveEditedMessage = async () => {
  const trimmed = editingText.trim()

  if (!trimmed || !editingMessageId || !selectedChannel?._id) return

  try {
   const res = await API.put(`/messages/${editingMessageId}`, { text: trimmed })
   replaceMessage(res.data)
   socket.emit("broadcastUpdatedMessage", {
    channelId: selectedChannel._id,
    message: res.data,
   })
   setFeedback("Message updated")
   cancelEditing()
  } catch (err) {
   reportUiError("Could not update message", err)
   setFeedback(err.response?.data?.message || "Could not update message")
  }
 }

 const deleteOwnMessage = async (message) => {
  const confirmed = window.confirm("Delete this message?")

  if (!confirmed || !selectedChannel?._id) return

  try {
   const res = await API.delete(`/messages/${message._id}`)
   replaceMessage(res.data)
   socket.emit("broadcastDeletedMessage", {
    channelId: selectedChannel._id,
    message: res.data,
   })
   setFeedback("Message deleted")

   if (editingMessageId === message._id) {
    cancelEditing()
   }
  } catch (err) {
   reportUiError("Could not delete message", err)
   setFeedback(err.response?.data?.message || "Could not delete message")
  }
 }

 useEffect(() => {
  bottomRef.current?.scrollIntoView({ block: "end" })
 }, [messages])

 const enhanceMessage = async () => {
  if (!text.trim()) {
   setFeedback("Write a message first")
   return
  }

  try {
   setAiLoading(true)
   const res = await API.post("/ai/enhance", { text, tone: aiTone })
   setAiOutputTitle(`Enhanced draft - ${aiTone}`)
   setAiOutputType("enhancement")
   setAiOutput(res.data.enhanced)
   setAiSaveName("")
   setAiItems([])
   setFeedback("Message enhanced")
  } catch (err) {
   reportUiError("Could not enhance message", err)
   setFeedback(err.response?.data?.message || "Could not enhance message")
  } finally {
   setAiLoading(false)
   setAiMenuOpen(false)
  }
 }

 const summarizeChannel = async () => {
  if (!selectedChannel?._id) return

  try {
   setAiLoading(true)
   const res = await API.post("/ai/summarize", {
    channelId: selectedChannel._id,
   })
   setAiOutputTitle("Chat summary")
   setAiOutputType("summary")
   setAiOutput(res.data.summary)
   setAiSaveName(res.data.suggestedName || `${selectedChannel.name} summary`)
   setAiItems([])
   setFeedback("Summary ready to save in your AI library")
  } catch (err) {
   reportUiError("Could not summarize channel", err)
   setFeedback(err.response?.data?.message || "Could not summarize channel")
  } finally {
   setAiLoading(false)
   setAiMenuOpen(false)
  }
 }

 const extractActionItems = async () => {
  if (!selectedChannel?._id) return

  try {
   setAiLoading(true)
   const res = await API.post("/ai/action-items", {
    channelId: selectedChannel._id,
   })
   setAiOutputTitle("Action items")
   setAiOutputType("action-items")
   setAiOutput(res.data.actionItems)
   setAiSaveName(res.data.suggestedName || `${selectedChannel.name} action plan`)
   setAiItems(res.data.items || [])
   setFeedback("Action items ready to save and convert into assigned tasks")
  } catch (err) {
   reportUiError("Could not extract action items", err)
   setFeedback(err.response?.data?.message || "Could not extract action items")
  } finally {
   setAiLoading(false)
   setAiMenuOpen(false)
  }
 }

 const saveSummary = async () => {
  if (!selectedChannel?._id || !aiOutput.trim()) return

  try {
   setAiSaving(true)
   await API.post("/ai/save-summary", {
    channelId: selectedChannel._id,
    name: aiSaveName.trim() || `${selectedChannel.name} summary`,
    content: aiOutput,
   })
   setFeedback("Summary saved to the AI library")
  } catch (err) {
   reportUiError("Could not save summary", err)
   setFeedback(err.response?.data?.message || "Could not save summary")
  } finally {
   setAiSaving(false)
  }
 }

 const saveActionItemsAsTasks = async () => {
  if (!selectedChannel?._id || !aiOutput.trim() || aiItems.length === 0) return

  try {
   setAiSaving(true)
   const res = await API.post("/ai/save-action-items", {
    channelId: selectedChannel._id,
    name: aiSaveName.trim() || `${selectedChannel.name} action plan`,
    content: aiOutput,
    items: aiItems,
   })
   setFeedback(`Saved action plan and created ${res.data.tasks?.length || 0} tasks assigned to you`)
  } catch (err) {
   reportUiError("Could not save action items as tasks", err)
   setFeedback(err.response?.data?.message || "Could not save action items as tasks")
  } finally {
   setAiSaving(false)
  }
 }

 const triggerFilePicker = () => {
  if (!selectedChannel) {
   setFeedback("Select a channel first")
   return
  }

  fileInputRef.current?.click()
 }

 const uploadFile = async (event) => {
  const file = event.target.files?.[0]

  if (!file || !selectedChannel?._id) return

  if (file.size > 15 * 1024 * 1024) {
   setFeedback("File must be 15 MB or smaller")
   event.target.value = ""
   return
  }

  const formData = new FormData()
  formData.append("file", file)
  formData.append("channelId", selectedChannel._id)
  formData.append("text", text.trim())

  try {
   setUploading(true)
   const res = await API.post("/messages/upload", formData, {
    headers: {
     "Content-Type": "multipart/form-data",
    },
   })

   socket.emit("broadcastUploadedMessage", {
    channelId: selectedChannel._id,
    message: res.data,
   })
   setText("")
   setFeedback("File shared")
  } catch (err) {
   reportUiError("Could not share file", err)
   setFeedback(err.response?.data?.message || "Could not share file")
  } finally {
   setUploading(false)
   event.target.value = ""
  }
 }

 useEffect(() => {
  if (!feedback) return

  const timeout = setTimeout(() => setFeedback(""), 2600)
  return () => clearTimeout(timeout)
 }, [feedback])

 return (
  <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[color:color-mix(in_srgb,var(--surface-1)_94%,transparent)]">
   <div className="shrink-0 border-b border-[color:var(--border-color)] px-5 py-5 sm:px-7">
    <div className="flex items-start justify-between gap-4">
     <div className="min-w-0">
      <p className="eyebrow text-[11px] font-semibold uppercase tracking-[0.22em]">
       {selectedProject ? selectedProject.name : "Workspace"}
      </p>
      <h2 className="mt-1 truncate text-xl font-semibold text-primary sm:text-2xl">
       {selectedChannel ? `# ${selectedChannel.name}` : "Select a channel"}
      </h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-secondary">
       {selectedChannel
        ? "Simple, focused conversation for updates, files, and huddles."
        : "Start chatting by selecting a workspace channel."}
      </p>
     </div>

     <div className="flex shrink-0 items-center gap-2">
      {selectedChannel ? (
       <VoiceHuddle selectedChannel={selectedChannel} currentUser={user} />
      ) : null}

      <div className="token-pill hidden md:flex">
       <FiUsers className="text-[var(--accent-primary)]" />
       Live
      </div>
     </div>
    </div>

    {aiOutput ? (
     <div className="mt-4 rounded-[24px] border border-[color:color-mix(in_srgb,var(--accent-primary)_22%,var(--border-color))] bg-[color:color-mix(in_srgb,var(--accent-primary)_8%,var(--surface-2))] p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
       <div className="min-w-0 flex-1">
        <p className="eyebrow text-[11px] font-semibold uppercase tracking-[0.18em]">
         AI workspace assistant
        </p>
        <h3 className="mt-1 text-base font-semibold text-primary">{aiOutputTitle}</h3>
        <p className="mt-2 text-sm leading-6 text-secondary">
         {aiOutputType === "summary"
          ? "Save this summary to your AI library so you can revisit it from the app anytime."
          : aiOutputType === "action-items"
            ? "Save this action plan and turn the extracted items into real tasks automatically assigned to you."
            : "Review the enhanced draft and insert it into the message box if you want to send it."}
        </p>
       </div>

       <div className="flex flex-col gap-3 xl:min-w-[22rem]">
        {aiOutputType === "summary" || aiOutputType === "action-items" ? (
         <input
          value={aiSaveName}
          onChange={(event) => setAiSaveName(event.target.value)}
          className="soft-input rounded-2xl px-4 py-3 text-sm"
          placeholder={aiOutputType === "summary" ? "Summary name" : "Action plan name"}
         />
        ) : null}

        <div className="flex flex-wrap gap-2">
         {aiOutputType === "enhancement" ? (
          <button
           onClick={() => setText(aiOutput)}
           className="btn-secondary px-4 py-2 text-sm"
          >
           <FiFileText />
           Insert into message box
          </button>
         ) : null}

         {aiOutputType === "summary" ? (
          <button
           onClick={saveSummary}
           disabled={aiSaving}
           className="btn-secondary px-4 py-2 text-sm disabled:opacity-60"
          >
           <FiBookmark />
           {aiSaving ? "Saving..." : "Save summary"}
          </button>
         ) : null}

         {aiOutputType === "action-items" ? (
          <button
           onClick={saveActionItemsAsTasks}
           disabled={aiSaving}
           className="btn-secondary px-4 py-2 text-sm disabled:opacity-60"
          >
           <FiCheck />
           {aiSaving ? "Creating..." : "Save and create tasks"}
          </button>
         ) : null}

         {aiOutputType === "summary" || aiOutputType === "action-items" ? (
          <button
           onClick={() => navigate("/overview")}
           className="btn-ghost px-4 py-2 text-sm"
          >
           <FiExternalLink />
           Open AI library
          </button>
         ) : null}

         {aiOutputType === "action-items" ? (
          <button
           onClick={() => navigate("/tasks")}
           className="btn-ghost px-4 py-2 text-sm"
          >
           <FiExternalLink />
           Open tasks
          </button>
         ) : null}

         <button
          onClick={resetAiOutput}
          className="btn-ghost px-4 py-2 text-sm"
         >
          Dismiss
         </button>
        </div>
       </div>
      </div>
      <pre className="mt-4 whitespace-pre-wrap rounded-[18px] bg-[color:color-mix(in_srgb,var(--surface-strong)_62%,transparent)] p-4 text-sm leading-6 text-secondary">{aiOutput}</pre>
     </div>
    ) : null}
   </div>

   <div className="chat-scroll min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
    {selectedChannel ? (
     <div className="flex min-h-full flex-col gap-4">
      {messages.length > 0 ? (
       messages.map((msg, index) => {
        const isMe = msg.sender?._id === currentUserId
        const isEditing = editingMessageId === msg._id
        const canManage = isMe && !msg.deleted
        const canEdit = canManage && msg.text

        return (
         <div
          key={msg._id || index}
          className={`group flex max-w-[48rem] flex-col rounded-[22px] border px-4 py-3.5 transition ${
           isMe
            ? "self-end border-[color:color-mix(in_srgb,var(--accent-primary)_26%,var(--border-color))] bg-[var(--accent-gradient)] text-[#09111f] shadow-[var(--shadow-soft)]"
            : "self-start border-[color:var(--border-color)] bg-[color:var(--surface-2)] text-[var(--text-primary)] shadow-[var(--shadow-soft)]"
          }`}
         >
          <div className="flex items-start justify-between gap-3">
           <div className="min-w-0 flex-1">
            {!isMe && (
             <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-primary)]">
              {msg.sender?.name}
             </p>
            )}

            {msg.deleted ? (
             <p className={`text-sm italic ${isMe ? "text-[#09111faa]" : "text-muted"}`}>
              Message deleted
             </p>
            ) : isEditing ? (
             <div className="min-w-[18rem] space-y-3">
              <textarea
               value={editingText}
               onChange={(event) => setEditingText(event.target.value)}
               rows={3}
               className="w-full resize-none rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--surface-strong)] px-3 py-3 text-sm leading-6 text-primary outline-none"
               autoFocus
              />
              <div className="flex justify-end gap-2">
               <button
                onClick={cancelEditing}
                className="message-action-btn"
                title="Cancel edit"
               >
                <FiX />
               </button>
               <button
                onClick={saveEditedMessage}
                className="message-action-btn message-action-btn--primary"
                title="Save edit"
               >
                <FiCheck />
               </button>
              </div>
             </div>
            ) : (
             <>
              {msg.text ? <p className="whitespace-pre-wrap text-sm leading-6">{msg.text}</p> : null}
              {renderAttachment(msg.attachment)}
             </>
            )}
           </div>

           {canManage && !isEditing ? (
            <div className="flex shrink-0 gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
             {canEdit ? (
              <button
               onClick={() => startEditing(msg)}
               className="message-action-btn"
               title="Edit message"
              >
               <FiEdit2 />
              </button>
             ) : null}
             <button
              onClick={() => deleteOwnMessage(msg)}
              className="message-action-btn message-action-btn--danger"
              title="Delete message"
             >
              <FiTrash2 />
             </button>
            </div>
           ) : null}
          </div>

          <p className={`mt-2 text-[11px] ${isMe ? "text-[#09111faa]" : "text-[var(--text-muted)]"}`}>
           {new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
           })}
           {msg.edited && !msg.deleted ? " - edited" : ""}
          </p>
         </div>
        )
       })
      ) : (
       <div className="glass-subtle m-auto max-w-md rounded-[28px] border-dashed px-6 py-10 text-center">
        <p className="text-base font-semibold text-primary">No messages yet</p>
        <p className="mt-2 text-sm leading-6 text-secondary">
         Start with a quick update or question.
        </p>
       </div>
      )}
      <div ref={bottomRef}></div>
     </div>
    ) : (
     <div className="flex h-full items-center justify-center">
      <div className="glass-shell max-w-lg rounded-[28px] px-8 py-10 text-center">
       <p className="eyebrow text-[11px] font-semibold uppercase tracking-[0.2em]">
        Ready
       </p>
       <h3 className="mt-3 text-2xl font-semibold text-primary">
        Open a channel to start chatting
       </h3>
       <p className="mt-3 text-sm leading-6 text-secondary">
        Keep work, messages, and handoffs in one place.
       </p>
      </div>
     </div>
    )}
   </div>

   {selectedChannel && (
    <div className="shrink-0 border-t border-[color:var(--border-color)] bg-[color:var(--surface-3)] px-5 py-4 sm:px-7">
     {feedback ? (
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[color:var(--border-color)] bg-[color:var(--surface-2)] px-3 py-1 text-xs font-semibold text-secondary">
       {feedback}
      </div>
     ) : null}
     <div className="glass-subtle flex items-end gap-3 rounded-[24px] p-3 shadow-[var(--shadow-soft)]">
      <input
       ref={fileInputRef}
       type="file"
       className="hidden"
       onChange={uploadFile}
      />

      <button
       onClick={triggerFilePicker}
       disabled={uploading}
       className="btn-ghost h-11 w-11 rounded-full p-0 text-sm disabled:opacity-60"
       title="Share file"
      >
       <AttachmentButtonIcon />
      </button>

      <textarea
       value={text}
       onChange={(e) => setText(e.target.value)}
       rows={1}
       className="max-h-32 min-h-[52px] flex-1 resize-none bg-transparent px-3 py-3 text-sm text-primary outline-none placeholder:text-[var(--text-muted)]"
       placeholder="Write a message, update, or next step..."
      />

      <div className="relative">
       <button
        onClick={() => setAiMenuOpen((prev) => !prev)}
        disabled={aiLoading}
        className="btn-secondary h-11 w-11 rounded-full p-0 text-sm transition hover:scale-[1.03] disabled:opacity-60"
        title="AI tools"
       >
        <FiZap />
       </button>

       {aiMenuOpen ? (
       <div className="absolute bottom-14 right-0 z-20 w-64 rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--surface-strong)] p-2 shadow-[var(--shadow-soft)]">
        <label className="mb-2 block px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Enhance tone
         </label>
         <select
          value={aiTone}
          onChange={(e) => setAiTone(e.target.value)}
          className="soft-select mb-2 rounded-xl px-3 py-2 text-sm"
         >
          {["professional", "friendly", "concise", "confident"].map((tone) => (
           <option key={tone} value={tone}>
            {tone}
           </option>
          ))}
         </select>
         <button onClick={enhanceMessage} className="ai-tool-option">
          <span>Enhance message</span>
          <FiZap />
         </button>
         <button onClick={summarizeChannel} className="ai-tool-option mt-1">
          <span>Generate summary</span>
          <FiBookmark />
         </button>
         <button onClick={extractActionItems} className="ai-tool-option mt-1">
          <span>Extract action items</span>
          <FiCheck />
         </button>
        </div>
       ) : null}
      </div>

      <button
       onClick={sendMessage}
       disabled={uploading}
       className="btn-primary rounded-2xl px-5 py-3 text-sm disabled:opacity-60"
      >
       <FiSend />
       Send
      </button>
     </div>
    </div>
   )}
  </section>
 )
}

export default ChatWindow
