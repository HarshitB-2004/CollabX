const mongoose = require("mongoose")

const channelSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },

    project:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Project",
        required:true
    },

    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }

},{timestamps:true})

module.exports = mongoose.model("Channel",channelSchema)