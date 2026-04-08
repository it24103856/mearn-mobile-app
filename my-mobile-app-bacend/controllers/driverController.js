import Driver from "../models/Driver.js";

//create driver
export const createDriver=async(req,res)=>{
    try {
        const {
            name,
            email,
            phone,
            address,
            licenseNumber,
            vehicleType,
            profileImage,
            description
        }=req.body;   

        const newDriver=await Driver.create({
            name,
            email,
            phone,
            address,
            licenseNumber,
            vehicleType,
            profileImage,
            description
        });

        const savedDriver=await newDriver.save();
        res.status(201).json({message:"Driver created successfully",data:savedDriver})
    } catch (error) {
        res.status(500).json({message:"Failed to create driver",error:error.message})
    }
}
//get driver by email
export const getDriver=async(req,res)=>{
    try {
       const email=req.params.email;
        const driver=await Driver.findOne({email:email.toLowerCase()});
        if(!driver){
            return res.status(404).json({message:"Driver not found"})
        }
        res.status(200).json({message:"Driver found",data:driver})
    } catch (error) {   
        res.status(500).json({message:"Failed to fetch driver",error:error.message})
    }
}

//get all drivers(admin)
export const getAllDrivers=async(req,res)=>{
    try {
        const drivers=await Driver.find();
        res.status(200).json({message:"Drivers fetched successfully",data:drivers})

    } catch (error) {
        res.status(500).json({message:"Failed to fetch drivers",error:error.message})
    }

}

export const getAllDriversed = async (req, res) => {
    try {
        // I've added both "email" and "address" here
        // So there won't be undefined error in Frontend
        const drivers = await Driver.find().select("name vehicleType profileImage phone email address"); 
        
        res.status(200).json({ 
            message: "Fetched successfully", 
            data: drivers 
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Failed to fetch", 
            error: error.message 
        });
    }
}

//update driver

export const updateDriver=async(req,res)=>{
    try {
        
        const {
            name,
            email,
            phone,
            address,
            licenseNumber,
            vehicleType,
            profileImage,
            description
        }=req.body;   
        const driver=await Driver.findOneAndUpdate({ email:email.toLowerCase()},{
            name,
            email,
            phone,
            address,
            licenseNumber,
            vehicleType,
            profileImage,
            description
        },{new:true});

        if(!driver){
            return res.status(404).json({message:"Driver not found"})

    }
        res.status(200).json({message:"Driver updated successfully",data:driver})
    } catch (error) {
        res.status(500).json({message:"Failed to update driver",error:error.message})
    }
}

//delete driver
export const deleteDriver=async(req,res)=>{
    try {
        const deleteDriver=await Driver.findOneAndDelete({ email:req.params.email.toLowerCase()});
        if(!deleteDriver){
            return res.status(404).json({message:"Driver not found"})
        }
        res.status(200).json({message:"Driver deleted successfully",data:deleteDriver})
    } catch (error) {
        res.status(500).json({message:"Failed to delete driver",error:error.message})
    }

}