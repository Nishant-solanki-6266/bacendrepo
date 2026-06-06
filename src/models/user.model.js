import mongoose, { Schema } from "mongoose";   // ye header me schema isliye likhte ki hme code me mongoose.Schema nhi likhna pde
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true     // white space ko remove kr dega database ne save krte time
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    avatar: {
        type: String,  // cloudinary ka use krege url use krege
        required: true,
    },
    coverImage: {
        type: String,   // cloudinary ka use krege url use krege
        // required:true,
    },
    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Video",
    }],
    password: {
        type: String,
        required: [true, "password is required"],
    },
    refreshToken: {
        type: String,
    }

}, { timestamps: true })

userSchema.pre("save", async function (next) {  // ese bolte :-- sbkuch phli bar save hua mtlb password bhi modidied hua to condition kr degi false or password ho jayega encrypt, dusri bar me sbkuch save(kuch update kiya) hua but password nhi hua modified to condition ke degi true to next ho jayega
    if (!this.isModified("password")) return next();   // yha ese currely bracket me likhakr check krna
    this.password = await bcrypt.hash(this.password, 10)
    next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY     // yha error aai thi bhai env se lana hai
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY,    //yha error aai thi bhai env se lana hai
        }
    )
}
export const User = mongoose.model("User", userSchema);