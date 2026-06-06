import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";
const connectDB=async()=>{
    try {
      const connectionInstances=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("\n mongo db connected successfully !! DB Host",`${connectionInstances.connection.host}`);
        // console.log(process.env.MONGODB_URI,DB_NAME);
        
    } catch (error) {
        console.log("mongo Db connection Failed means your database error",error);
        process.exit(1); // Exit the process with failure
    }
}
export default connectDB;