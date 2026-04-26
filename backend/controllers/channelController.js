const Channel = require("../models/Channel")
const Project = require("../models/Project")
const Message = require("../models/Message")

// CREATE CHANNEL

exports.createChannel = async (req,res)=>{

    try{

        const {name,projectId} = req.body

        if(!name?.trim() || !projectId){
            return res.status(400).json({message:"Channel name and project are required"})
        }

        const project = await Project.findOne({
            _id: projectId,
            members: req.user._id
        })

        if(!project){
            return res.status(404).json({message:"Project not found"})
        }

        const channel = await Channel.create({
            name:name.trim(),
            project:projectId,
            createdBy:req.user._id
        })

        res.status(201).json(channel)

    }catch(error){
        res.status(500).json({error:error.message})
    }

}



// GET CHANNELS OF A PROJECT

exports.getProjectChannels = async (req,res)=>{

    try{

        const {projectId} = req.params

        const project = await Project.findOne({
            _id: projectId,
            members: req.user._id
        })

        if(!project){
            return res.status(404).json({message:"Project not found"})
        }

        const channels = await Channel.find({
            project:projectId
        })

        res.json(channels)

    }catch(error){
        res.status(500).json({error:error.message})
    }

}

exports.deleteChannel = async (req,res)=>{

    try{

        const { channelId } = req.params

        const channel = await Channel.findById(channelId)

        if(!channel){
            return res.status(404).json({message:"Channel not found"})
        }

        const project = await Project.findOne({
            _id: channel.project,
            members: req.user._id
        })

        if(!project){
            return res.status(403).json({message:"Not authorized"})
        }

        await Message.deleteMany({ channel: channelId })
        await Channel.findByIdAndDelete(channelId)

        res.json({ message: "Channel deleted" })

    }catch(error){
        res.status(500).json({error:error.message})
    }

}
