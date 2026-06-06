import mongoose, { Schema } from "mongoose";


const subscriptionSchema=new Schema({
   subscriber:{
    type:Schema.Types.ObjectId,   // one who is subcribing:
    ref:"User"
   },
   channel:{
     type:Schema.Types.ObjectId,   // one who to whom subcriber is subcribing:
     ref:"User"
   }
   

},{timestamps:true})

export const subscription=mongoose.model("Subscription",subscriptionSchema)