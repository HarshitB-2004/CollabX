const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema({

    channel:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Channel",
        required:true
    },

    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    text:{
        type:String,
        default:""
    },

    attachment:{
        fileName:{
            type:String,
            default:""
        },
        fileUrl:{
            type:String,
            default:""
        },
        mimeType:{
            type:String,
            default:""
        },
        size:{
            type:Number,
            default:0
        },
        kind:{
            type:String,
            enum:["image","video","audio","file",""],
            default:""
        }
    }

},{timestamps:true})

module.exports = mongoose.model("Message",messageSchema)
