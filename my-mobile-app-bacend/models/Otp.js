import mongoose from "mongoose";

const OtpSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true
    } ,
    otp:{
        type:String,
        required:true
    },
    otpExpiry:{
        type:Date,
        required:true,
        index:{expires:'10m'} // ttl index eka set karannwa
    }
})

const Otp=mongoose.model("Otp",OtpSchema)
export default Otp;
