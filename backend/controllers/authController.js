const User = require("../models/User")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

// REGISTER
exports.registerUser = async (req,res) => {
    try{

        const {name,email,password} = req.body

        if(!name?.trim() || !email?.trim() || !password?.trim()){
            return res.status(400).json({message:"Name, email, and password are required"})
        }

        if(password.trim().length < 6){
            return res.status(400).json({message:"Password must be at least 6 characters"})
        }

        const userExists = await User.findOne({email})

        if(userExists){
            return res.status(400).json({message:"User already exists"})
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)

        const user = await User.create({
            name,
            email,
            password:hashedPassword
        })

        const token = jwt.sign(
            {id:user._id},
            process.env.JWT_SECRET,
            {expiresIn:"7d"}
        )

        res.status(201).json({
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email
            }
        })

    }catch(error){
        res.status(500).json({error:error.message})
    }
}


// LOGIN
exports.loginUser = async (req,res) => {

    try{

        const {email,password} = req.body

        if(!email?.trim() || !password?.trim()){
            return res.status(400).json({message:"Email and password are required"})
        }

        const user = await User.findOne({email})

        if(!user){
            return res.status(400).json({message:"Invalid credentials"})
        }

        const isMatch = await bcrypt.compare(password,user.password)

        if(!isMatch){
            return res.status(400).json({message:"Invalid credentials"})
        }

        const token = jwt.sign(
            {id:user._id},
            process.env.JWT_SECRET,
            {expiresIn:"7d"}
        )

        res.json({
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email
            }
        })

    }catch(error){
        res.status(500).json({error:error.message})
    }
}
