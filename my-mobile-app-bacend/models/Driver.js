import mongoose from "mongoose";

const driverSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    phone:{
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    licenseNumber:{
        type:String,
        required:true
    },
    vehicleType:{
        type:String,
        required:true
    },
    profileImage: {
         type: String,
            required: true
         },
         description: {
            type: String,
            required: false
         }
})

    export default mongoose.model("Driver", driverSchema)