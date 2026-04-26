const Project = require("../models/Project")
const User = require("../models/User")
const Channel = require("../models/Channel")
const Task = require("../models/Task")
const Message = require("../models/Message")

// CREATE PROJECT

exports.createProject = async (req,res)=>{
    try{

        const {name,description} = req.body

        if(!name?.trim()){
            return res.status(400).json({message:"Project name is required"})
        }

        const project = await Project.create({
            name:name.trim(),
            description:(description || "").trim(),
            owner:req.user._id,
            members:[req.user._id]
        })

        res.status(201).json(project)

    }catch(error){
        res.status(500).json({error:error.message})
    }
}



// GET USER PROJECTS

exports.getUserProjects = async (req,res)=>{

    try{

        const projects = await Project.find({
            members:req.user._id
        }).populate("members","name email")

        res.json(projects)

    }catch(error){
        res.status(500).json({error:error.message})
    }
}



// ADD MEMBER

exports.addMember = async (req,res)=>{

    try{

        const {projectId,userId} = req.body

        const project = await Project.findOne({
            _id: projectId,
            members: req.user._id
        })

        if(!project){
            return res.status(404).json({message:"Project not found"})
        }

        const user = await User.findById(userId)

        if(!user){
            return res.status(404).json({message:"User not found"})
        }

        const alreadyMember = project.members.some(
            (memberId) => memberId.toString() === userId
        )

        if(alreadyMember){
            return res.status(400).json({message:"User is already a member"})
        }

        project.members.push(userId)

        await project.save()

        const populatedProject = await Project.findById(project._id).populate("members","name email avatar")

        res.json(populatedProject)

    }catch(error){
        res.status(500).json({error:error.message})
    }
}

exports.deleteProject = async (req,res)=>{

    try{

        const { projectId } = req.params

        const project = await Project.findOne({
            _id: projectId,
            owner: req.user._id
        })

        if(!project){
            return res.status(404).json({message:"Project not found or only the owner can delete it"})
        }

        const channelIds = await Channel.find({ project: projectId }).distinct("_id")

        await Message.deleteMany({ channel: { $in: channelIds } })
        await Channel.deleteMany({ project: projectId })
        await Task.deleteMany({ project: projectId })
        await Project.findByIdAndDelete(projectId)

        res.json({ message: "Workspace deleted" })

    }catch(error){
        res.status(500).json({error:error.message})
    }
}
