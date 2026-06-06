import multer from "multer";

const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,"./public/temp")    // yha save ho rhi hai hai or vapis req.body me value ja rhi hai
    },
    filename:function(req,file,cb){
        cb(null,file.originalname)
    }
})
export const upload=multer({storage,})


