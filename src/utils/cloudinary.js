import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API_KEY,
    api_secret:process.env.CLOUD_API_SECRET
})
console.log(process.env.CLOUD_NAME);

const uploadOnCloudinary=async(localFilePath)=>{
    try {
        if (!localFilePath)  return null;
      const responce= await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        // console.log("localFilePath Uploded:-",responce.url);
            fs.unlinkSync(localFilePath)   // to yha se temp se file remove hogi dekha meene aai thi yeh code likhne ke phele
          return responce;  // yha se clodinary ka url milega (publically url)

    } catch (error) {
        fs.unlinkSync(localFilePath); // error aane ke bad bhi jo hmari public me data rhega usko dilate kr dega
        return null;
    }
} 

export {uploadOnCloudinary};


