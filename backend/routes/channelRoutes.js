const express = require("express")
const router = express.Router()

const protect = require("../middleware/authMiddleware")

const {
createChannel,
getProjectChannels,
deleteChannel
} = require("../controllers/channelController")

router.post("/create",protect,createChannel)

router.get("/project/:projectId",protect,getProjectChannels)

router.delete("/:channelId",protect,deleteChannel)

module.exports = router
