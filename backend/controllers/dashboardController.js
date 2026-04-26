const Channel = require("../models/Channel")
const Project = require("../models/Project")
const Task = require("../models/Task")

const getDeadlineStatus = (dueDate) => {
    if (!dueDate) return null

    const now = new Date()
    const due = new Date(dueDate)
    const diffMs = due.getTime() - now.getTime()
    const diffHours = Math.round(diffMs / (1000 * 60 * 60))

    if (diffMs < 0) {
        return {
            level: "overdue",
            hoursRemaining: diffHours
        }
    }

    if (diffMs <= 1000 * 60 * 60 * 48) {
        return {
            level: "due-soon",
            hoursRemaining: diffHours
        }
    }

    return null
}

exports.getDashboardOverview = async (req, res) => {
    try {
        const userId = req.user._id

        const [projects, assignedTasks, completedTasks, recentTasks, channelCount] = await Promise.all([
            Project.find({ members: userId }).populate("members", "name email"),
            Task.find({ assignedTo: userId, status: { $ne: "completed" } })
                .populate("project", "name")
                .sort({ dueDate: 1, createdAt: -1 })
                .limit(6),
            Task.find({ assignedTo: userId, status: "completed" })
                .populate("project", "name")
                .sort({ updatedAt: -1 })
                .limit(6),
            Task.find({ assignedTo: userId })
                .populate("project", "name")
                .sort({ updatedAt: -1 })
                .limit(8),
            Channel.countDocuments({
                project: {
                    $in: await Project.find({ members: userId }).distinct("_id")
                }
            })
        ])

        const projectIds = projects.map((project) => project._id)
        const [workspaceTaskCount, completedTaskCount] = await Promise.all([
            Task.countDocuments({ project: { $in: projectIds } }),
            Task.countDocuments({ project: { $in: projectIds }, status: "completed" })
        ])

        const deadlineAlerts = assignedTasks
            .map((task) => {
                const deadlineStatus = getDeadlineStatus(task.dueDate)

                if (!deadlineStatus) return null

                return {
                    _id: task._id,
                    title: task.title,
                    projectName: task.project?.name || "Workspace",
                    dueDate: task.dueDate,
                    priority: task.priority,
                    status: task.status,
                    ...deadlineStatus
                }
            })
            .filter(Boolean)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

        res.json({
            profile: req.user,
            workspaceOverview: {
                totalProjects: projects.length,
                totalChannels: channelCount,
                totalTasks: workspaceTaskCount,
                completedTasks: completedTaskCount
            },
            projects,
            assignedTasks,
            completedTasks,
            recentTasks,
            deadlineAlerts
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}
