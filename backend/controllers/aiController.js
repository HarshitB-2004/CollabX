const { GoogleGenerativeAI } = require("@google/generative-ai")
const Message = require("../models/Message")
const Channel = require("../models/Channel")

const genAI = process.env.GEMINI_API_KEY
 ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
 : null

const getModel = () => {
 if (!genAI) {
  const error = new Error("GEMINI_API_KEY is not configured")
  error.statusCode = 503
  throw error
 }

 return genAI.getGenerativeModel({
  model: "gemini-1.5-pro-latest",
 })
}

const ensureChannelAccess = async (channelId, userId) => {
 const channel = await Channel.findById(channelId).populate("project")

 if (!channel) return null

 const isMember = channel.project.members.some(
  (memberId) => memberId.toString() === userId.toString()
 )

 return isMember ? channel : null
}

const normalizeMessageContent = (message) => {
 const attachmentLabel = message.attachment?.fileName
  ? `[Attachment: ${message.attachment.fileName}]`
  : ""
 const text = (message.text || "").trim()

 return [text, attachmentLabel].filter(Boolean).join(" ").trim()
}

const buildTranscript = (messages) =>
 messages
  .map((message) => {
   const sender = message.sender?.name || "Unknown"
   const content = normalizeMessageContent(message) || "[No text]"

   return `${sender}: ${content}`
  })
  .join("\n")

const respondWithAiError = (res, error) => {
 const statusCode = error.statusCode || 500
 return res.status(statusCode).json({ message: error.message || "AI request failed" })
}

exports.enhanceText = async (req, res) => {

 try {

  const { text, tone = "professional" } = req.body

  if (!text || !text.trim()) {
   return res.status(400).json({ message: "Text is required" })
  }

  const supportedTones = ["professional", "friendly", "concise", "confident"]
  const selectedTone = supportedTones.includes(tone) ? tone : "professional"
  const model = getModel()

  const prompt = `
Rewrite the following team chat message.

Goals:
- Keep the same meaning.
- Make it clearer and more polished.
- Use a ${selectedTone} tone.
- Keep it ready to send in a workplace chat.
- Return only the rewritten message with no extra commentary.

Message:
"${text.trim()}"
  `

  const result = await model.generateContent(prompt)
  const response = result.response.text().trim()

  res.json({ enhanced: response })

 } catch (error) {
  respondWithAiError(res, error)
 }

}

exports.summarizeChannel = async (req, res) => {
 try {
  const { channelId } = req.body

  if (!channelId) {
   return res.status(400).json({ message: "Channel is required" })
  }

  const channel = await ensureChannelAccess(channelId, req.user._id)

  if (!channel) {
   return res.status(404).json({ message: "Channel not found" })
  }

  const recentMessages = await Message.find({ channel: channelId })
   .populate("sender", "name")
   .sort({ createdAt: -1 })
   .limit(20)

  if (recentMessages.length === 0) {
   return res.status(400).json({ message: "No messages available to summarize" })
  }

  const transcript = buildTranscript(recentMessages.reverse())
  const model = getModel()
  const prompt = `
Summarize this team chat.

Return plain text with exactly these sections:
Summary:
- bullet 1
- bullet 2
- bullet 3

Action Items:
- item 1
- item 2

Risks or Blockers:
- blocker 1

Keep it concise and specific.

Chat transcript:
${transcript}
`
  const result = await model.generateContent(prompt)
  const summary = result.response.text().trim()

  res.json({ summary })
 } catch (error) {
  respondWithAiError(res, error)
 }
}

exports.extractActionItems = async (req, res) => {
 try {
  const { channelId } = req.body

  if (!channelId) {
   return res.status(400).json({ message: "Channel is required" })
  }

  const channel = await ensureChannelAccess(channelId, req.user._id)

  if (!channel) {
   return res.status(404).json({ message: "Channel not found" })
  }

  const recentMessages = await Message.find({ channel: channelId })
   .populate("sender", "name")
   .sort({ createdAt: -1 })
   .limit(30)

  if (recentMessages.length === 0) {
   return res.status(400).json({ message: "No messages available to analyze" })
  }

  const transcript = buildTranscript(recentMessages.reverse())
  const model = getModel()
  const prompt = `
Review this chat transcript and extract action items.

Return plain text only using this format:
- Owner or Team: task description | priority | due date if mentioned

If an owner or due date is missing, write "Unassigned" or "No due date mentioned".
Only include actionable items.

Chat transcript:
${transcript}
`

  const result = await model.generateContent(prompt)
  const actionItems = result.response.text().trim()

  res.json({ actionItems })
 } catch (error) {
  respondWithAiError(res, error)
 }
}
