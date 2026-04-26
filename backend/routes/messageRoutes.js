const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const fs = require("fs")

const protect = require("../middleware/authMiddleware")

const {
    getChannelMessages,
    uploadAttachment,
    updateMessage,
    deleteMessage
} = require("../controllers/messageController")

const uploadsDir = path.join(__dirname, "..", "uploads")

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const safeName = file.originalname.replace(/\s+/g, "-")
        cb(null, `${Date.now()}-${safeName}`)
    }
})

const upload = multer({
    storage,
    limits: {
        fileSize: 15 * 1024 * 1024
    }
})

router.post("/upload",protect,upload.single("file"),uploadAttachment)

router.put("/:messageId",protect,updateMessage)

router.delete("/:messageId",protect,deleteMessage)

router.get("/:channelId",protect,getChannelMessages)

module.exports = router
