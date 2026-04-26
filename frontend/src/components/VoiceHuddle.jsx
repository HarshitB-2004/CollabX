import { useEffect, useMemo, useRef, useState } from "react"
import { FiMic, FiMicOff, FiPhone, FiPhoneOff, FiVideo, FiVideoOff } from "react-icons/fi"
import { socket } from "../socket/socket"

const rtcConfig = {
 iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
}

const VoiceHuddle = ({ selectedChannel, currentUser }) => {
 const [inCall, setInCall] = useState(false)
 const [isMuted, setIsMuted] = useState(false)
 const [isCameraEnabled, setIsCameraEnabled] = useState(false)
 const [hasLocalVideoTrack, setHasLocalVideoTrack] = useState(false)
 const [participants, setParticipants] = useState([])
 const [remoteStreams, setRemoteStreams] = useState([])
 const [statusMessage, setStatusMessage] = useState("")
 const [callMode, setCallMode] = useState("audio")
 const [detailsOpen, setDetailsOpen] = useState(false)
 const [huddleInvite, setHuddleInvite] = useState(null)

 const localStreamRef = useRef(null)
 const localVideoRef = useRef(null)
 const peersRef = useRef(new Map())
 const remoteAudioRefs = useRef(new Map())
 const participantInfoRef = useRef(new Map())
 const activeChannelRef = useRef(null)
 const currentUserId = currentUser?.id || currentUser?._id

 const visibleParticipants = useMemo(
  () => participants.filter((participant) => participant.socketId !== socket.id),
  [participants]
 )
 const status = inCall
  ? statusMessage ||
    (visibleParticipants.length > 0
     ? `${visibleParticipants.length + 1} people in the ${callMode === "video" ? "video" : "voice"} huddle`
     : `Waiting for teammates to join the ${callMode === "video" ? "video" : "voice"} huddle`)
  : statusMessage || "Ready for a quick huddle"

 const syncLocalPreview = () => {
  if (localVideoRef.current) {
   localVideoRef.current.srcObject = localStreamRef.current
  }
 }

 const upsertRemoteStream = (socketId, stream) => {
  const user = participantInfoRef.current.get(socketId) || { name: "Teammate" }
  const hasVideo = stream.getVideoTracks().length > 0

  setRemoteStreams((prev) => {
   const next = prev.filter((entry) => entry.socketId !== socketId)
   next.push({ socketId, stream, user, hasVideo })
   return next
  })
 }

 const attachLocalTracks = (peerConnection) => {
  localStreamRef.current?.getTracks().forEach((track) => {
   peerConnection.addTrack(track, localStreamRef.current)
  })
 }

 const cleanupPeer = (socketId) => {
  const peer = peersRef.current.get(socketId)
  if (peer) {
   peer.close()
   peersRef.current.delete(socketId)
  }

  const remoteAudio = remoteAudioRefs.current.get(socketId)
  if (remoteAudio) {
   remoteAudio.srcObject = null
   remoteAudioRefs.current.delete(socketId)
  }

  participantInfoRef.current.delete(socketId)
  setRemoteStreams((prev) => prev.filter((entry) => entry.socketId !== socketId))
 }

 const buildPeerConnection = (socketId) => {
  const existing = peersRef.current.get(socketId)
  if (existing) return existing

  const peerConnection = new RTCPeerConnection(rtcConfig)
  attachLocalTracks(peerConnection)

  peerConnection.onicecandidate = (event) => {
   if (event.candidate) {
    socket.emit("voiceIceCandidate", {
     target: socketId,
     candidate: event.candidate,
    })
   }
  }

  peerConnection.ontrack = (event) => {
   let audio = remoteAudioRefs.current.get(socketId)

   if (!audio) {
    audio = new Audio()
    audio.autoplay = true
    remoteAudioRefs.current.set(socketId, audio)
   }

   audio.srcObject = event.streams[0]
   upsertRemoteStream(socketId, event.streams[0])
  }

  peerConnection.onconnectionstatechange = () => {
   if (["failed", "closed", "disconnected"].includes(peerConnection.connectionState)) {
    cleanupPeer(socketId)
   }
  }

  peersRef.current.set(socketId, peerConnection)
  return peerConnection
 }

 const startHuddle = async (mode = "audio") => {
  if (!selectedChannel || inCall) return

  try {
   const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: mode === "video",
   })

   localStreamRef.current = stream
   activeChannelRef.current = selectedChannel._id
   setCallMode(mode)
   setInCall(true)
   setIsMuted(false)
   setHasLocalVideoTrack(stream.getVideoTracks().length > 0)
   setIsCameraEnabled(stream.getVideoTracks().length > 0)
   setStatusMessage(mode === "video" ? "Joining video huddle..." : "Joining voice huddle...")
   setDetailsOpen(true)
   syncLocalPreview()

   socket.emit("joinVoiceChannel", {
    channelId: selectedChannel._id,
    user: {
     id: currentUserId,
     name: currentUser?.name,
     mode,
    },
   })
  } catch (error) {
   console.log(error)
   setStatusMessage(mode === "video" ? "Camera and microphone access are required" : "Microphone access is required")
  }
 }

 const joinHuddle = async () => {
  if (!huddleInvite?.active) return
  await startHuddle(huddleInvite.mode === "video" ? "video" : "audio")
 }

 const leaveHuddle = () => {
  if (activeChannelRef.current) {
   socket.emit("leaveVoiceChannel", { channelId: activeChannelRef.current })
  }

  peersRef.current.forEach((_, socketId) => cleanupPeer(socketId))
  peersRef.current.clear()

  localStreamRef.current?.getTracks().forEach((track) => track.stop())
  localStreamRef.current = null
  activeChannelRef.current = null
  setParticipants([])
  setRemoteStreams([])
  setInCall(false)
  setIsMuted(false)
  setHasLocalVideoTrack(false)
  setIsCameraEnabled(false)
  setCallMode("audio")
  setStatusMessage("")
  setDetailsOpen(false)

  if (localVideoRef.current) {
   localVideoRef.current.srcObject = null
  }
 }

 const toggleMute = () => {
  if (!localStreamRef.current) return

  const nextMuted = !isMuted
  localStreamRef.current.getAudioTracks().forEach((track) => {
   track.enabled = !nextMuted
  })
  setIsMuted(nextMuted)
 }

 const toggleCamera = () => {
  const videoTrack = localStreamRef.current?.getVideoTracks?.()[0]
  if (!videoTrack) return

  const nextEnabled = !videoTrack.enabled
  videoTrack.enabled = nextEnabled
  setIsCameraEnabled(nextEnabled)
 }

 useEffect(() => {
  syncLocalPreview()
 }, [inCall])

 useEffect(() => {
  const handleParticipants = async (nextParticipants) => {
   setStatusMessage("")
   nextParticipants.forEach((participant) => {
    participantInfoRef.current.set(participant.socketId, participant.user || { name: "Teammate" })
   })
   setParticipants(nextParticipants)

   if (!inCall || !socket.id) return

   for (const participant of nextParticipants) {
    if (participant.socketId === socket.id) continue
    if (peersRef.current.has(participant.socketId)) continue
    if (socket.id > participant.socketId) continue

    const peerConnection = buildPeerConnection(participant.socketId)
    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    socket.emit("voiceOffer", {
     target: participant.socketId,
     sdp: offer,
     caller: {
      id: currentUserId,
      name: currentUser?.name,
      mode: callMode,
    },
    })
   }
  }

  const handleVoiceOffer = async ({ sdp, from, caller }) => {
   participantInfoRef.current.set(from, caller || { name: "Teammate" })
   const peerConnection = buildPeerConnection(from)
   await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp))
   const answer = await peerConnection.createAnswer()
   await peerConnection.setLocalDescription(answer)

   socket.emit("voiceAnswer", {
    target: from,
    sdp: answer,
   })
  }

  const handleVoiceAnswer = async ({ sdp, from }) => {
   const peerConnection = peersRef.current.get(from)
   if (!peerConnection) return

   await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp))
  }

  const handleVoiceIceCandidate = async ({ candidate, from }) => {
   const peerConnection = peersRef.current.get(from) || buildPeerConnection(from)
   await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
  }

  const handleVoiceUserLeft = ({ socketId }) => {
   cleanupPeer(socketId)
   setParticipants((prev) => prev.filter((participant) => participant.socketId !== socketId))
  }

  socket.on("voiceParticipants", handleParticipants)
  socket.on("voiceOffer", handleVoiceOffer)
  socket.on("voiceAnswer", handleVoiceAnswer)
  socket.on("voiceIceCandidate", handleVoiceIceCandidate)
  socket.on("voiceUserLeft", handleVoiceUserLeft)

  return () => {
   socket.off("voiceParticipants", handleParticipants)
   socket.off("voiceOffer", handleVoiceOffer)
   socket.off("voiceAnswer", handleVoiceAnswer)
   socket.off("voiceIceCandidate", handleVoiceIceCandidate)
   socket.off("voiceUserLeft", handleVoiceUserLeft)
  }
 }, [callMode, currentUserId, currentUser?.name, inCall])

 useEffect(() => {
  const handleHuddleStarted = (payload) => {
   if (payload.channelId !== selectedChannel?._id) return
   if (payload.startedBy?.id === currentUserId) return

   setHuddleInvite({
    active: true,
    startedBy: payload.startedBy,
    participantCount: payload.participantCount || 1,
    mode: payload.mode || "audio"
   })
  }

  const handleHuddlePresence = (payload) => {
   if (payload.channelId !== selectedChannel?._id) return

   if (!payload.active) {
    setHuddleInvite(null)
    return
   }

   if (payload.startedBy?.id === currentUserId && !inCall) return

   setHuddleInvite((prev) => ({
    active: true,
    startedBy: payload.startedBy || prev?.startedBy || null,
    participantCount: payload.participantCount || prev?.participantCount || 1,
    mode: payload.mode || prev?.mode || "audio"
   }))
  }

  const handleHuddleEnded = (payload) => {
   if (payload.channelId !== selectedChannel?._id) return
   setHuddleInvite(null)
  }

  socket.on("huddleStarted", handleHuddleStarted)
  socket.on("huddlePresence", handleHuddlePresence)
  socket.on("huddleEnded", handleHuddleEnded)

  return () => {
   socket.off("huddleStarted", handleHuddleStarted)
   socket.off("huddlePresence", handleHuddlePresence)
   socket.off("huddleEnded", handleHuddleEnded)
  }
 }, [currentUserId, inCall, selectedChannel])

 useEffect(() => () => leaveHuddle(), [])

 useEffect(() => {
  if (!inCall) return undefined

  if (!selectedChannel || (activeChannelRef.current && selectedChannel._id !== activeChannelRef.current)) {
   const timeout = setTimeout(() => leaveHuddle(), 0)
   return () => clearTimeout(timeout)
  }

  return undefined
 }, [inCall, selectedChannel])

 useEffect(() => {
  if (!selectedChannel) {
   setHuddleInvite(null)
  }
 }, [selectedChannel])

 return (
  <div className="relative flex items-center gap-2">
   {inCall ? (
    <>
     <button onClick={toggleMute} className="btn-ghost h-10 w-10 rounded-full p-0 text-sm" title={isMuted ? "Unmute" : "Mute"}>
      {isMuted ? <FiMicOff /> : <FiMic />}
     </button>

     {hasLocalVideoTrack ? (
      <button onClick={toggleCamera} className="btn-ghost h-10 w-10 rounded-full p-0 text-sm" title="Camera">
       {isCameraEnabled ? <FiVideo /> : <FiVideoOff />}
      </button>
     ) : null}

     <button onClick={() => setDetailsOpen((current) => !current)} className="btn-ghost h-10 w-10 rounded-full p-0 text-sm" title="Open call">
      <FiPhone />
     </button>

     <button onClick={leaveHuddle} className="btn-danger h-10 w-10 rounded-full p-0 text-sm" title="Leave call">
      <FiPhoneOff />
     </button>

     <span className="token-pill hidden lg:inline-flex">{status}</span>
    </>
   ) : (
    <>
     <button
      onClick={() => startHuddle("audio")}
      disabled={!selectedChannel}
      className="btn-ghost h-10 w-10 rounded-full p-0 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      title="Start voice huddle"
     >
      <FiPhone />
     </button>
     <button
      onClick={() => startHuddle("video")}
      disabled={!selectedChannel}
      className="btn-ghost h-10 w-10 rounded-full p-0 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      title="Start video huddle"
     >
      <FiVideo />
     </button>
    </>
   )}

   {!inCall && huddleInvite?.active ? (
    <div className="ml-1 hidden items-center gap-2 rounded-full border border-[color:var(--border-color)] bg-[color:var(--surface-2)] px-3 py-1.5 md:flex">
     <span className="text-xs text-secondary">
      {huddleInvite.startedBy?.name || "Someone"} started a {huddleInvite.mode} huddle
     </span>
     <button
      onClick={joinHuddle}
      className="btn-secondary px-3 py-1.5 text-xs"
      type="button"
     >
      Join
     </button>
    </div>
   ) : null}

   {inCall && detailsOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
     <div className="glass-shell max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[28px] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
       <div>
        <p className="eyebrow text-[11px] font-semibold uppercase tracking-[0.18em]">Huddle</p>
        <h3 className="mt-1 text-lg font-semibold text-primary">{callMode === "video" ? "Video call" : "Voice call"}</h3>
        <p className="mt-1 text-sm text-secondary">{status}</p>
       </div>
       <button onClick={() => setDetailsOpen(false)} className="btn-ghost px-4 py-2 text-sm">Close</button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
       <span className="token-pill border-[color:color-mix(in_srgb,var(--accent-primary)_26%,var(--border-color))] bg-[color:color-mix(in_srgb,var(--accent-primary)_12%,var(--surface-2))] text-[var(--accent-primary)]">
        You {callMode === "video" ? "(video)" : ""}
       </span>
       {visibleParticipants.map((participant) => (
        <span key={participant.socketId} className="token-pill">
         {participant.user?.name || "Teammate"}
         {participant.user?.mode === "video" ? " (video)" : ""}
        </span>
       ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
       <div className="rounded-[22px] border border-[color:var(--border-color)] bg-[color:var(--surface-2)] p-3">
      <div className="mb-2 flex items-center justify-between">
       <p className="text-sm font-semibold text-primary">You</p>
       <span className="token-pill">{callMode}</span>
      </div>
      <div className="overflow-hidden rounded-[18px] bg-[color:var(--surface-1)]">
       {hasLocalVideoTrack ? (
        <video
         ref={localVideoRef}
         autoPlay
         muted
         playsInline
         className="h-40 w-full object-cover"
        />
       ) : (
        <div className="flex h-40 items-center justify-center text-sm text-secondary">
         Audio only
        </div>
       )}
      </div>
     </div>

     {remoteStreams.map((entry) => (
      <div
       key={entry.socketId}
       className="rounded-[22px] border border-[color:var(--border-color)] bg-[color:var(--surface-2)] p-3"
      >
       <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-primary">{entry.user?.name || "Teammate"}</p>
        <span className="token-pill">{entry.hasVideo ? "video" : "audio"}</span>
       </div>
       <div className="overflow-hidden rounded-[18px] bg-[color:var(--surface-1)]">
        {entry.hasVideo ? (
         <video
          autoPlay
          playsInline
         ref={(node) => {
           if (node) {
            node.srcObject = entry.stream
           }
          }}
          className="h-40 w-full object-cover"
         />
        ) : (
         <div className="flex h-40 items-center justify-center text-sm text-secondary">
          Audio only
         </div>
        )}
      </div>
     </div>
     ))}
      </div>
     </div>
    </div>
   ) : null}
  </div>
 )
}

export default VoiceHuddle
