const express = require("express")
const router = express.Router()
const protect = require("../middleware/authMiddleware")

const {
 enhanceText,
 summarizeChannel,
 extractActionItems,
 saveSummary,
 saveActionItemsAsTasks,
 getInsightLibrary,
} = require("../controllers/aiController")

router.post("/enhance", protect, enhanceText)
router.post("/summarize", protect, summarizeChannel)
router.post("/action-items", protect, extractActionItems)
router.post("/save-summary", protect, saveSummary)
router.post("/save-action-items", protect, saveActionItemsAsTasks)
router.get("/library", protect, getInsightLibrary)

module.exports = router
