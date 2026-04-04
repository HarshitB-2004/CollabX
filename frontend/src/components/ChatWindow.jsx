import { useEffect, useRef, useState } from "react"
import { FiSend, FiUsers, FiZap } from "react-icons/fi"
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

const ChatWindow = ({ selectedChannel, selectedProject }) => {
 const [messages, setMessages] = useState([])
 const [text, setText] = useState("")
 const [aiMenuOpen, setAiMenuOpen] = useState(false)
 const [aiLoading, setAiLoading] = useState(false)
 const [aiTone, setAiTone] = useState("professional")
 const [aiOutput, setAiOutput] = useState("")
 const [aiOutputTitle, setAiOutputTitle] = useState("")
 const [uploading, setUploading] = useState(false)
 const [feedback, setFeedback] = useState("")
 const bottomRef = useRef(null)
 const fileInputRef = useRef(null)

 const user = JSON.parse(localStorage.getItem("user"))
 const currentUserId = user?.id || user?._id

 const fetchMessages = async () => {
  if (!selectedChannel) return

  const res = await API.get(`/messages/${selectedChannel._id}`)
  setMessages(res.data)
 }

 useEffect(() => {
  if (!selectedChannel) {
   setMessages([])
   return
  }

  socket.emit("joinChannel", selectedChannel._id)
  fetchMessages()
 }, [selectedChannel])

 useEffect(() => {
  socket.on("receiveMessage", (message) => {
   setMessages((prev) => [...prev, message])
  })

  return () => {
   socket.off("receiveMessage")
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
   setText(res.data.enhanced)
   setAiOutputTitle(`Message enhancement - ${aiTone}`)
   setAiOutput(res.data.enhanced)
   setFeedback("Message enhanced")
  } catch (err) {
   console.log(err)
   setFeedback("Could not enhance message")
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
   setAiOutput(res.data.summary)
   setText(res.data.summary)
   setFeedback("Channel summary added to composer")
  } catch (err) {
   console.log(err)
   setFeedback(err.response?.data?.message || "Could not extract action items")
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
   setAiOutput(res.data.actionItems)
   setText(res.data.actionItems)
   setFeedback("Action items added to composer")
  } catch (err) {
   console.log(err)
   setFeedback(err.response?.data?.message || "Could not summarize channel")
  } finally {
   setAiLoading(false)
   setAiMenuOpen(false)
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
   console.log(err)
   setFeedback(err.response?.data?.message || "Could not share file")
  } finally {
   setUploading(false)
   event.target.value = ""
  }
 }

 useEffect(() => {
  if (!feedback) return

  const timeout = setTimeout(() => setFeedback(""), 2200)
  return () => clearTimeout(timeout)
 }, [feedback])

 return (
  <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[color:color-mix(in_srgb,var(--surface-1)_94%,transparent)]">
   <div className="shrink-0 border-b border-[color:var(--border-color)] px-4 py-4 sm:px-5">
    <div className="flex items-center justify-between gap-4">
     <div>
      <p className="eyebrow text-[11px] font-semibold uppercase tracking-[0.22em]">
       {selectedProject ? selectedProject.name : "Workspace"}
      </p>
      <h2 className="mt-1 text-xl font-semibold text-primary sm:text-2xl">
       {selectedChannel ? `# ${selectedChannel.name}` : "Select a channel"}
      </h2>
      <p className="mt-1 text-sm text-secondary">
       {selectedChannel
        ? "Simple, focused conversation space."
        : "Pick a workspace and channel to start chatting."}
      </p>
     </div>

     <div className="token-pill hidden md:flex">
      <FiUsers className="text-[var(--accent-primary)]" />
      Live
     </div>
    </div>

    {selectedChannel && (
     <div className="mt-5">
      <VoiceHuddle selectedChannel={selectedChannel} currentUser={user} />
     </div>
    )}

    {aiOutput ? (
     <div className="mt-5 rounded-[24px] border border-[color:color-mix(in_srgb,var(--accent-primary)_22%,var(--border-color))] bg-[color:color-mix(in_srgb,var(--accent-primary)_8%,var(--surface-2))] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
       <div>
        <p className="eyebrow text-[11px] font-semibold uppercase tracking-[0.18em]">
         AI tools
        </p>
        <h3 className="mt-1 text-base font-semibold text-primary">{aiOutputTitle}</h3>
       </div>
       <div className="flex gap-2">
        <button
         onClick={() => setText(aiOutput)}
         className="btn-secondary px-4 py-2 text-sm"
        >
         Use in composer
        </button>
        <button
         onClick={() => setAiOutput("")}
         className="btn-ghost px-4 py-2 text-sm"
        >
         Dismiss
        </button>
       </div>
      </div>
      <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-secondary">{aiOutput}</pre>
     </div>
    ) : null}
   </div>

   <div className="chat-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
    {selectedChannel ? (
     <div className="flex min-h-full flex-col gap-3">
      {messages.length > 0 ? (
       messages.map((msg, index) => {
        const isMe = msg.sender?._id === currentUserId

        return (
         <div
          key={index}
          className={`max-w-[42rem] rounded-[20px] border px-4 py-3 transition ${
           isMe
            ? "self-end border-[color:color-mix(in_srgb,var(--accent-primary)_28%,var(--border-color))] bg-[var(--accent-gradient)] text-[#09111f] shadow-[var(--shadow-soft)]"
            : "self-start border-[color:var(--border-color)] bg-[color:var(--surface-2)] text-[var(--text-primary)] shadow-[var(--shadow-soft)]"
          }`}
         >
          {!isMe && (
           <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-primary)]">
            {msg.sender?.name}
           </p>
          )}

          {msg.text ? <p className="text-sm leading-6">{msg.text}</p> : null}
          {renderAttachment(msg.attachment)}

          <p className={`mt-2 text-[11px] ${isMe ? "text-[#09111faa]" : "text-[var(--text-muted)]"}`}>
           {new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
           })}
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
    <div className="shrink-0 border-t border-[color:var(--border-color)] bg-[color:var(--surface-3)] px-4 py-4 sm:px-5">
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
        className="btn-secondary h-11 w-11 rounded-full p-0 text-sm disabled:opacity-60"
        title="AI tools"
       >
        <FiZap />
       </button>

       {aiMenuOpen ? (
       <div className="absolute bottom-14 right-0 z-20 w-56 rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--surface-strong)] p-2 shadow-[var(--shadow-soft)]">
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
         <button
          onClick={enhanceMessage}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-primary transition hover:bg-[color:var(--surface-2)]"
         >
          <span>Enhance message</span>
         </button>
         <button
          onClick={summarizeChannel}
          className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-primary transition hover:bg-[color:var(--surface-2)]"
         >
          <span>Chat summarizer</span>
         </button>
         <button
          onClick={extractActionItems}
          className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-primary transition hover:bg-[color:var(--surface-2)]"
         >
          <span>Extract action items</span>
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
