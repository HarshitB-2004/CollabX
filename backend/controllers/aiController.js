const { GoogleGenerativeAI } = require("@google/generative-ai")
const Message = require("../models/Message")
const Channel = require("../models/Channel")
const Task = require("../models/Task")
const AIInsight = require("../models/AIInsight")

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
  model: "gemini-2.5-flash",
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

const respondWithAiError = (res, error, context = "AI request failed") => {
 console.error(`[AI] ${context}`, {
  message: error.message,
  statusCode: error.statusCode,
  stack: error.stack,
 })

 const statusCode = error.statusCode || 500
 return res.status(statusCode).json({ message: error.message || "AI request failed" })
}

const fetchRecentMessages = async (channelId, limit) => {
 const recentMessages = await Message.find({ channel: channelId })
  .populate("sender", "name")
  .sort({ createdAt: -1 })
  .limit(limit)

 if (recentMessages.length === 0) {
  const error = new Error("No messages available to analyze")
  error.statusCode = 400
  throw error
 }

 return recentMessages.reverse()
}

const parseJsonPayload = (rawText) => {
 const normalized = rawText.trim()
 const jsonText = normalized
  .replace(/^```json\s*/i, "")
  .replace(/^```\s*/i, "")
  .replace(/```$/, "")
  .trim()

 return JSON.parse(jsonText)
}

const formatActionItems = (items) =>
 items
  .map((item) => {
   const dueDate = item.dueDate || "No due date mentioned"
   return `- ${item.title} | ${item.priority} | ${dueDate}`
  })
  .join("\n")

const normalizePriority = (value) => {
 const supported = ["low", "medium", "high", "urgent"]
 return supported.includes(value) ? value : "medium"
}

const normalizeDueDate = (value) => {
 if (!value) return undefined

 const parsed = new Date(value)
 return Number.isNaN(parsed.getTime()) ? undefined : parsed
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
  respondWithAiError(res, error, "Failed to enhance text")
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

  const transcript = buildTranscript(await fetchRecentMessages(channelId, 20))
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

  res.json({
   summary,
   suggestedName: `${channel.name} summary`
  })
 } catch (error) {
  respondWithAiError(res, error, "Failed to summarize channel")
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

  const transcript = buildTranscript(await fetchRecentMessages(channelId, 30))
  const model = getModel()
  const prompt = `
Review this team chat transcript and extract actionable tasks.

Return valid JSON only using this shape:
{
  "items": [
    {
      "title": "short task title",
      "description": "1-2 sentence explanation",
      "priority": "low|medium|high|urgent",
      "dueDate": "YYYY-MM-DD or null"
    }
  ]
}

Rules:
- Include only real actionable follow-ups.
- Keep titles short and professional.
- If no due date is clearly mentioned, use null.
- If priority is unclear, use "medium".
- Never include markdown fences or commentary.

Chat transcript:
${transcript}
`

  const result = await model.generateContent(prompt)
  const parsed = parseJsonPayload(result.response.text())
  const items = Array.isArray(parsed.items)
   ? parsed.items
      .filter((item) => item?.title)
      .map((item) => ({
       title: item.title.trim(),
       description: (item.description || "").trim(),
       priority: normalizePriority(item.priority),
       dueDate: item.dueDate || null,
      }))
   : []

  if (items.length === 0) {
   return res.status(400).json({ message: "No actionable items found in this channel" })
  }

  res.json({
   actionItems: formatActionItems(items),
   items,
   suggestedName: `${channel.name} action plan`
  })
 } catch (error) {
  respondWithAiError(res, error, "Failed to extract action items")
 }
}

exports.saveSummary = async (req, res) => {
 try {
  const { channelId, name, content } = req.body

  if (!channelId || !content?.trim()) {
   return res.status(400).json({ message: "Channel and summary content are required" })
  }

  const channel = await ensureChannelAccess(channelId, req.user._id)

  if (!channel) {
   return res.status(404).json({ message: "Channel not found" })
  }

  const insight = await AIInsight.create({
   name: (name || `${channel.name} summary`).trim(),
   type: "summary",
   content: content.trim(),
   channel: channel._id,
   project: channel.project._id,
   createdBy: req.user._id,
  })

  const populatedInsight = await AIInsight.findById(insight._id)
   .populate("channel", "name")
   .populate("project", "name")
   .populate("createdBy", "name email")

  res.status(201).json(populatedInsight)
 } catch (error) {
  respondWithAiError(res, error, "Failed to save summary")
 }
}

exports.saveActionItemsAsTasks = async (req, res) => {
 try {
  const { channelId, name, content, items = [] } = req.body

  if (!channelId || !content?.trim() || !Array.isArray(items) || items.length === 0) {
   return res.status(400).json({ message: "Channel, action item content, and extracted items are required" })
  }

  const channel = await ensureChannelAccess(channelId, req.user._id)

  if (!channel) {
   return res.status(404).json({ message: "Channel not found" })
  }

  const createdTasks = await Task.insertMany(
   items
    .filter((item) => item?.title)
    .map((item) => ({
     title: item.title.trim(),
     description: (item.description || "Created from CollabX AI action extraction").trim(),
     project: channel.project._id,
     assignedTo: req.user._id,
     priority: normalizePriority(item.priority),
     status: "todo",
     dueDate: normalizeDueDate(item.dueDate),
    }))
  )

  const insight = await AIInsight.create({
   name: (name || `${channel.name} action plan`).trim(),
   type: "action-items",
   content: content.trim(),
   channel: channel._id,
   project: channel.project._id,
   createdBy: req.user._id,
   relatedTasks: createdTasks.map((task) => task._id),
  })

  const [populatedInsight, populatedTasks] = await Promise.all([
   AIInsight.findById(insight._id)
    .populate("channel", "name")
    .populate("project", "name")
    .populate("createdBy", "name email")
    .populate("relatedTasks"),
   Task.find({ _id: { $in: createdTasks.map((task) => task._id) } })
    .populate("assignedTo", "name email")
    .populate("project", "name")
    .sort({ createdAt: -1 })
  ])

  res.status(201).json({
   insight: populatedInsight,
   tasks: populatedTasks,
  })
 } catch (error) {
  respondWithAiError(res, error, "Failed to save action items as tasks")
 }
}

exports.getInsightLibrary = async (req, res) => {
 try {
  const insights = await AIInsight.find({ createdBy: req.user._id })
   .populate("channel", "name")
   .populate("project", "name")
   .populate("relatedTasks", "title status priority dueDate")
   .sort({ createdAt: -1 })
   .limit(20)

  res.json(insights)
 } catch (error) {
  respondWithAiError(res, error, "Failed to load AI insight library")
 }
}
