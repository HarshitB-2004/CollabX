const express = require("express")
const router = express.Router()

const protect = require("../middleware/authMiddleware")

const {
createChannel,
getProjectChannels
} = require("../controllers/channelController")

router.post("/create",protect,createChannel)

router.get("/project/:projectId",protect,getProjectChannels)

module.exports = router