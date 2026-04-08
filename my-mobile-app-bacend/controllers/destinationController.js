import Destination from "../models/Destination.js";

//create destination
export const createDestination=async(req,res)=>{
    try {
        const {
            
            name,
            description,
            image,
            province,
            district,
            city
        }=req.body;
        const newDestination=await Destination.create({
        
            name,
            description,
            image,
            province,
            district,
            city
        });
        res.status(201).json({message:"Destination created successfully",data:newDestination})
    }catch(error){
        res.status(500).json({message:"Failed to create destination",error:error.message})
    }
}

//get all destination
export const getAllDestinations=async(req,res)=>{
    try {
        const destinations=await Destination.find();
        res.status(200).json({message:"Destinations fetched successfully",data:destinations})
    } catch (error) {
        res.status(500).json({message:"Failed to fetch destinations",error:error.message})
    }
}

//get destination by id
export const getDestinationById=async(req,res)=>{
    try {
        const destination=await Destination.findById(req.params.id);
        res.status(200).json({message:"Destination fetched successfully",data:destination})
    } catch (error) {
        res.status(500).json({message:"Failed to fetch destination",error:error.message})
    }

}

//update destination
export const updateDestination=async(req,res)=>{
    try {
        const updatedDestination=await Destination.findByIdAndUpdate(req.params.id,req.body,{new:true});
        res.status(200).json({message:"Destination updated successfully",data:updatedDestination})
    } catch (error) {
        res.status(500).json({message:"Failed to update destination",error:error.message})
    }
    }

    //delete destination
export const deleteDestination=async(req,res)=>{
    try {
        await Destination.findByIdAndDelete(req.params.id);
        res.status(200).json({message:"Destination deleted successfully"})
    } catch (error) {
        res.status(500).json({message:"Failed to delete destination",error:error.message})
    }
}