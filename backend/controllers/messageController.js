const Message = require("../models/Message")
const Channel = require("../models/Channel")

const ensureChannelAccess = async (channelId, userId) => {
    const channel = await Channel.findById(channelId).populate("project")

    if (!channel) {
        return null
    }

    const isMember = channel.project.members.some(
        (memberId) => memberId.toString() === userId.toString()
    )

    return isMember ? channel : null
}

// GET MESSAGES OF A CHANNEL

exports.getChannelMessages = async (req,res)=>{

    try{

        const {channelId} = req.params

        const channel = await ensureChannelAccess(channelId, req.user._id)

        if(!channel){
            return res.status(404).json({message:"Channel not found"})
        }

        const messages = await Message.find({
            channel:channelId
        })
        .populate("sender","name email")
        .sort({createdAt:1})

        res.json(messages)

    }catch(error){
        res.status(500).json({error:error.message})
    }

}

exports.uploadAttachment = async (req, res) => {
    try {
        const { channelId, text } = req.body

        if (!channelId) {
            return res.status(400).json({ message: "Channel is required" })
        }

        const channel = await ensureChannelAccess(channelId, req.user._id)

        if (!channel) {
            return res.status(404).json({ message: "Channel not found" })
        }

        if (!req.file) {
            return res.status(400).json({ message: "A file is required" })
        }

        const mimeType = req.file.mimetype || ""
        const kind = mimeType.startsWith("image/")
            ? "image"
            : mimeType.startsWith("video/")
              ? "video"
              : mimeType.startsWith("audio/")
                ? "audio"
                : "file"

        const message = await Message.create({
            channel: channelId,
            sender: req.user._id,
            text: (text || "").trim(),
            attachment: {
                fileName: req.file.originalname,
                fileUrl: `/uploads/${req.file.filename}`,
                mimeType,
                size: req.file.size,
                kind
            }
        })

        const populatedMessage = await Message.findById(message._id).populate("sender", "name email")

        res.status(201).json(populatedMessage)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

exports.updateMessage = async (req, res) => {
    try {
        const { messageId } = req.params
        const text = (req.body.text || "").trim()

        if (!text) {
            return res.status(400).json({ message: "Message text is required" })
        }

        const message = await Message.findById(messageId)

        if (!message || message.deleted) {
            return res.status(404).json({ message: "Message not found" })
        }

        const channel = await ensureChannelAccess(message.channel, req.user._id)

        if (!channel) {
            return res.status(404).json({ message: "Channel not found" })
        }

        if (message.sender?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You can only edit your own messages" })
        }

        message.text = text
        message.edited = true
        await message.save()

        const populatedMessage = await Message.findById(message._id).populate("sender", "name email")

        res.json(populatedMessage)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params
        const message = await Message.findById(messageId)

        if (!message || message.deleted) {
            return res.status(404).json({ message: "Message not found" })
        }

        const channel = await ensureChannelAccess(message.channel, req.user._id)

        if (!channel) {
            return res.status(404).json({ message: "Channel not found" })
        }

        if (message.sender?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You can only delete your own messages" })
        }

        message.text = ""
        message.attachment = {
            fileName: "",
            fileUrl: "",
            mimeType: "",
            size: 0,
            kind: ""
        }
        message.deleted = true
        message.deletedAt = new Date()
        await message.save()

        const populatedMessage = await Message.findById(message._id).populate("sender", "name email")

        res.json(populatedMessage)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}
