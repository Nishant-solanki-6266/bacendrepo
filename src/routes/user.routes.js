import { Router } from "express";
import { loginUser, logOutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJwt} from "../middlewares/auth.middleware.js";
const router=Router();


router.route("/register").post(
    upload.fields([
                {
                    name:"avatar",
                    maxCount:1
                },
                {
                    name:"coverImage",
                    maxCount:1
                }        

    ])
    ,registerUser)

 // login route
    router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJwt,logOutUser)
// isme verify jwt ki jarurat nhi hai ki user login hai ya nhi.ye bs accesstoken expiry ho jaye 1 din bad to fir se Accesstoken or refreshtoken generate kr skte hai.
router.route("/refreshToken").post(refreshAccessToken)

export default router;    // export default tb hi de skte hai jb hum khii pr mn chaha import ka name use kr rhe ho jese:-import userRoute from "user.controler"  ,vrma currly brCKET DETE HAIS