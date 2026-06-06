import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema= new Schema({
   videoFile:{
    type:String,   // cloudinary  url se aayega
    required:true
   },
   thumbnail:{     // clodinary mtlb video ki picture
     type:String,
     required:true
   },
   title:{
     type:String,
     required:true
   },
   description:{
     type:String,
     required:true
   },
   duration:{      // clodinary hme duration dega jb upload hogi tb responce me result or result ke andar duration (result.duration)
     type:Number,
     required:true
   },
   view:{      
     type:Number,
     default:0
   },
   isPublished:{    // published mtlb ye hme dikhana hai ya nhi 
    type:Boolean,
    default:true
   },
   owner:{
    type:Schema.Types.ObjectId,    // jo mongodb me hoti hai autometic generate vhi objectId hai
    ref:"User"
   }
},{timestamps:true})
videoSchema.plugin(mongooseAggregatePaginate)// chat gpt bta rha hai ki ye hmare kam jab aayega tb bhut sare video hoge or unhe page 1 me 10 page 2 me 10 dikhna hoto 
export const Video=mongoose.model("Video",videoSchema)