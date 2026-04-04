const express = require("express")
const router = express.Router()

const protect = require("../middleware/authMiddleware")

const {
createTask,
getProjectTasks,
getMyTasks,
updateTask,
updateTaskStatus,
deleteTask
} = require("../controllers/taskController")

router.get("/my-tasks",protect,getMyTasks)

router.post("/create",protect,createTask)

router.get("/project/:projectId",protect,getProjectTasks)

router.put("/status",protect,updateTaskStatus)

router.put("/:taskId",protect,updateTask)

router.delete("/:taskId",protect,deleteTask)

module.exports = router
