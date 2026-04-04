const express = require("express")
const router = express.Router()
const protect = require("../middleware/authMiddleware")

const {
 enhanceText,
 summarizeChannel,
 extractActionItems,
} = require("../controllers/aiController")

router.post("/enhance", protect, enhanceText)
router.post("/summarize", protect, summarizeChannel)
router.post("/action-items", protect, extractActionItems)

module.exports = router
