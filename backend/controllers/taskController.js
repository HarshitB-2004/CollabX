const Task = require("../models/Task")
const Project = require("../models/Project")

const populateTask = (query) =>
    query
        .populate("assignedTo", "name email avatar")
        .populate("project", "name")

const ensureProjectAccess = async (projectId, userId) => {
    const project = await Project.findOne({
        _id: projectId,
        members: userId
    })

    return project
}

const isProjectMember = (project, userId) =>
    project.members.some((memberId) => memberId.toString() === userId.toString())

exports.createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            projectId,
            assignedTo,
            dueDate,
            priority,
            status
        } = req.body

        const project = await ensureProjectAccess(projectId, req.user._id)

        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        if (!title?.trim()) {
            return res.status(400).json({ message: "Task title is required" })
        }

        if (assignedTo && !isProjectMember(project, assignedTo)) {
            return res.status(400).json({ message: "Assignee must be a project member" })
        }

        const task = await Task.create({
            title: title.trim(),
            description: (description || "").trim(),
            project: projectId,
            assignedTo: assignedTo || undefined,
            dueDate: dueDate || undefined,
            priority: priority || "medium",
            status: status || "todo"
        })

        const populatedTask = await populateTask(Task.findById(task._id))

        res.status(201).json(populatedTask)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

exports.getProjectTasks = async (req, res) => {
    try {
        const { projectId } = req.params

        const project = await ensureProjectAccess(projectId, req.user._id)

        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        }

        const tasks = await populateTask(
            Task.find({ project: projectId }).sort({ createdAt: -1 })
        )

        res.json(tasks)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

exports.getMyTasks = async (req, res) => {
    try {
        const tasks = await populateTask(
            Task.find({ assignedTo: req.user._id }).sort({ dueDate: 1, createdAt: -1 })
        )

        res.json(tasks)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

exports.updateTask = async (req, res) => {
    try {
        const { taskId } = req.params
        const {
            title,
            description,
            assignedTo,
            dueDate,
            priority,
            status
        } = req.body

        const existingTask = await Task.findById(taskId)

        if (!existingTask) {
            return res.status(404).json({ message: "Task not found" })
        }

        const project = await ensureProjectAccess(existingTask.project, req.user._id)

        if (!project) {
            return res.status(403).json({ message: "Not authorized" })
        }

        if (title !== undefined && !title.trim()) {
            return res.status(400).json({ message: "Task title is required" })
        }

        if (assignedTo && !isProjectMember(project, assignedTo)) {
            return res.status(400).json({ message: "Assignee must be a project member" })
        }

        const task = await Task.findByIdAndUpdate(
            taskId,
            {
                ...(title !== undefined ? { title } : {}),
                ...(description !== undefined ? { description } : {}),
                ...(assignedTo !== undefined ? { assignedTo: assignedTo || null } : {}),
                ...(dueDate !== undefined ? { dueDate: dueDate || null } : {}),
                ...(priority !== undefined ? { priority } : {}),
                ...(status !== undefined ? { status } : {})
            },
            { new: true, runValidators: true }
        )

        const populatedTask = await populateTask(Task.findById(task._id))

        res.json(populatedTask)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

exports.updateTaskStatus = async (req, res) => {
    try {
        const { taskId, status } = req.body

        const existingTask = await Task.findById(taskId)

        if (!existingTask) {
            return res.status(404).json({ message: "Task not found" })
        }

        const project = await ensureProjectAccess(existingTask.project, req.user._id)

        if (!project) {
            return res.status(403).json({ message: "Not authorized" })
        }

        const task = await Task.findByIdAndUpdate(
            taskId,
            { status },
            { new: true, runValidators: true }
        )

        const populatedTask = await populateTask(Task.findById(task._id))

        res.json(populatedTask)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

exports.deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params
        const task = await Task.findById(taskId)

        if (!task) {
            return res.status(404).json({ message: "Task not found" })
        }

        const project = await ensureProjectAccess(task.project, req.user._id)

        if (!project) {
            return res.status(403).json({ message: "Not authorized" })
        }

        await Task.findByIdAndDelete(taskId)

        res.json({ message: "Task deleted" })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}
