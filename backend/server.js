require("dotenv").config()
const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const http = require("http")
const path = require("path")
const fs = require("fs")
const {Server} = require("socket.io")

const connectDB = require("./config/db")
const PORT = process.env.PORT || 5000

dotenv.config()
connectDB()

const app = express()
const uploadsDir = path.join(__dirname, "uploads")

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}

app.use(cors())
app.use(express.json())
app.use("/uploads", express.static(uploadsDir))


app.use("/api/auth",require("./routes/authRoutes"))
app.use("/api/projects",require("./routes/projectRoutes"))
app.use("/api/channels",require("./routes/channelRoutes"))
app.use("/api/messages",require("./routes/messageRoutes"))
app.use("/api/tasks",require("./routes/taskRoutes"))
app.use("/api/ai", require("./routes/aiRoutes"))
app.use("/api/dashboard", require("./routes/dashboardRoutes"))
app.use("/api/users", require("./routes/userRoutes"))
app.use("/api/friends", require("./routes/friendRoutes"))

const server = http.createServer(app)

const io = new Server(server,{
    cors:{
        origin:"*"
    }
})
const Message = require("./models/Message")
const activeVoiceRooms = new Map()

const getRoomParticipants = (channelId) => activeVoiceRooms.get(channelId) || new Map()
const emitHuddleState = (channelId, { startedBy = null } = {}) => {
    const room = getRoomParticipants(channelId)
    const participants = Array.from(room.entries()).map(([socketId, participant]) => ({
        socketId,
        user: participant
    }))

    io.to(channelId).emit("huddlePresence", {
        channelId,
        active: room.size > 0,
        participantCount: room.size,
        startedBy,
        mode: participants[0]?.user?.mode || "audio"
    })

    if (room.size === 0) {
        io.to(channelId).emit("huddleEnded", { channelId })
    }
}

io.on("connection",(socket)=>{

    console.log("User connected:",socket.id)

    // join channel
    socket.on("joinChannel",(channelId)=>{
        socket.join(channelId)
        console.log("User joined channel:",channelId)
    })

    socket.on("joinVoiceChannel", ({ channelId, user }) => {
        socket.join(`voice:${channelId}`)
        socket.data.voiceChannelId = channelId
        socket.data.voiceUser = user

        const room = getRoomParticipants(channelId)
        const wasEmpty = room.size === 0
        room.set(socket.id, user)
        activeVoiceRooms.set(channelId, room)

        const participants = Array.from(room.entries()).map(([socketId, participant]) => ({
            socketId,
            user: participant
        }))

        io.to(`voice:${channelId}`).emit("voiceParticipants", participants)

        if (wasEmpty) {
            io.to(channelId).emit("huddleStarted", {
                channelId,
                startedBy: user,
                participantCount: room.size,
                mode: user?.mode || "audio"
            })
        }

        emitHuddleState(channelId, { startedBy: user })
    })

    socket.on("voiceOffer", ({ target, sdp, caller }) => {
        io.to(target).emit("voiceOffer", {
            sdp,
            caller,
            targetChannelId: socket.data.voiceChannelId,
            from: socket.id
        })
    })

    socket.on("voiceAnswer", ({ target, sdp }) => {
        io.to(target).emit("voiceAnswer", {
            sdp,
            from: socket.id
        })
    })

    socket.on("voiceIceCandidate", ({ target, candidate }) => {
        io.to(target).emit("voiceIceCandidate", {
            candidate,
            from: socket.id
        })
    })

    socket.on("leaveVoiceChannel", ({ channelId }) => {
        const activeChannelId = channelId || socket.data.voiceChannelId

        if (!activeChannelId) return

        const room = getRoomParticipants(activeChannelId)
        room.delete(socket.id)

        if (room.size === 0) {
            activeVoiceRooms.delete(activeChannelId)
        } else {
            activeVoiceRooms.set(activeChannelId, room)
        }

        socket.leave(`voice:${activeChannelId}`)
        socket.data.voiceChannelId = null
        socket.data.voiceUser = null

        const participants = Array.from(room.entries()).map(([socketId, participant]) => ({
            socketId,
            user: participant
        }))

        io.to(`voice:${activeChannelId}`).emit("voiceParticipants", participants)
        io.to(`voice:${activeChannelId}`).emit("voiceUserLeft", {
            socketId: socket.id
        })

        emitHuddleState(activeChannelId)
    })

    // send message
    socket.on("sendMessage",async(data)=>{

        const {channelId,senderId,text,attachment} = data

        const trimmedText = (text || "").trim()

        if(!channelId || !senderId || (!trimmedText && !attachment?.fileUrl)){
            return
        }

        const message = await Message.create({
            channel:channelId,
            sender:senderId,
            text:trimmedText,
            attachment:attachment || undefined
        })

        const populatedMessage = await message.populate("sender","name")

io.to(channelId).emit("receiveMessage",populatedMessage)

    })

    socket.on("broadcastUploadedMessage", ({ channelId, message }) => {
        if (!channelId || !message) return
        io.to(channelId).emit("receiveMessage", message)
    })

    socket.on("broadcastUpdatedMessage", ({ channelId, message }) => {
        if (!channelId || !message) return
        io.to(channelId).emit("messageUpdated", message)
    })

    socket.on("broadcastDeletedMessage", ({ channelId, message }) => {
        if (!channelId || !message) return
        io.to(channelId).emit("messageDeleted", message)
    })

    socket.on("disconnect",()=>{
        const activeChannelId = socket.data.voiceChannelId

        if (activeChannelId) {
            const room = getRoomParticipants(activeChannelId)
            room.delete(socket.id)

            if (room.size === 0) {
                activeVoiceRooms.delete(activeChannelId)
            } else {
                activeVoiceRooms.set(activeChannelId, room)
            }

            const participants = Array.from(room.entries()).map(([socketId, participant]) => ({
                socketId,
                user: participant
            }))

            io.to(`voice:${activeChannelId}`).emit("voiceParticipants", participants)
            io.to(`voice:${activeChannelId}`).emit("voiceUserLeft", {
                socketId: socket.id
            })

            emitHuddleState(activeChannelId)
        }

        console.log("User disconnected")
    })

})



server.listen(PORT,()=>{
    console.log(`Server running on ${PORT}`)
})
