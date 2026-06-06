// logout krne ke liye hmko pta hona chahiye ki kon sa user loggin hai isliye middleware bnaya check krega ki user login hai ya nhi.
// logic ye hai ki login ke smy hmen cookie bheje the to unhi cookie ke jariye bta chl jayega ki kiska accessToken hai .

import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import  jwt from "jsonwebtoken"

const verifyJwt = asyncHandler(async (req, res, next) => {

  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    
        if (!token) {
          throw new ApiError(401,"Unauthorized  request .mtlb yha AccessToken aayega   Jo login hai . but ye error me hai to nhi aaya hoga")
        }
        // console.log("auth ka hai Token:-",token);
        
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
                // console.log("auth ka hai jo hmne sigh me diya tha vhi return me aayega decodedtoken",new Date(decodedToken.exp * 1000));
                
        const user = await User.findById(decodedToken?._id).select(" -password -refreshToken")
            console.log("auth ka hai chekc kr ki yha kya user aaya hai",user);
            
        if (!user) {
          // ToDo : next Video discuss about fronted
          throw new ApiError(401,"invlid AccessToken. mtln tune jo auth me user nikal decoded token se vo wala user nhi hai")
        }
        //    console.log("auth",req.user);
           
        req.user=user; // ye user login hai mtlb . isko multiple jgh use kr lege fir.
        next();
  } catch (error) {
    throw new ApiError(401,error?.message||"Invalid AccessToken")
  }
});

export  {verifyJwt};