const express = require("express")
const router = express.Router()

const protect = require("../middleware/authMiddleware")
const {
    getFriendSummary,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest
} = require("../controllers/friendController")

router.get("/", protect, getFriendSummary)
router.post("/request", protect, sendFriendRequest)
router.put("/:requestId/accept", protect, acceptFriendRequest)
router.put("/:requestId/reject", protect, rejectFriendRequest)

module.exports = router
