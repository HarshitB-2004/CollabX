const express = require("express")
const router = express.Router()

const protect = require("../middleware/authMiddleware")

const {
createProject,
getUserProjects,
addMember
} = require("../controllers/projectController")

router.post("/create",protect,createProject)

router.get("/my-projects",protect,getUserProjects)

router.post("/add-member",protect,addMember)

module.exports = router