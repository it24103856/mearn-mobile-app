import Vehicle from "../models/Vehicle.js";

// Create a new vehicle entry
export const createVehicle = async (req, res) => {
    try {
        const newVehicle = new Vehicle(req.body);
        const savedVehicle = await newVehicle.save();
        
        res.status(201).json({
            success: true,
            message: "Vehicle created successfully",
            data: savedVehicle
        });
    } catch (error) {
        // Handle MongoDB duplicate key error (11000) for registrationNumber
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: "A vehicle with this registration number already exists!" 
            });
        }
        res.status(500).json({ success: false, message: "Failed to create vehicle", error: error.message });
    }
};

// Retrieve all vehicles from the database
export const getAllVehicles = async (req, res) => {
    try {
        // Populates driver data (name and contact) along with the vehicle
        const vehicles = await Vehicle.find().populate("driverId", "name contactNumber");
        
        res.status(200).json({
            success: true,
            count: vehicles.length,
            data: vehicles
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch vehicles", error: error.message });
    }
};

// Retrieve a specific vehicle by its ID
export const getVehicleById = async (req, res) => {
    const id = req.params.id;
    try {
        const vehicle = await Vehicle.findById(id).populate("driverId", "name contactNumber");
        
        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Vehicle not found" });
        }
        
        res.status(200).json({ success: true, data: vehicle });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching vehicle details", error: error.message });
    }
};

// Update an existing vehicle's data
export const updateVehicle = async (req, res) => {
    const id = req.params.id;
    try {
        const updatedVehicle = await Vehicle.findByIdAndUpdate(
            id, 
            { $set: req.body }, 
            { new: true, runValidators: true } 
        );

        if (!updatedVehicle) {
            return res.status(404).json({ success: false, message: "Vehicle to update not found" });
        }

        res.status(200).json({
            success: true,
            message: "Vehicle updated successfully",
            data: updatedVehicle
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Registration number conflict detected" });
        }
        res.status(500).json({ success: false, message: "Update failed", error: error.message });
    }
};

// Delete a vehicle from the system
export const deleteVehicle = async (req, res) => {
    const id = req.params.id;
    try {
        const deletedVehicle = await Vehicle.findByIdAndDelete(id);

        if (!deletedVehicle) {
            return res.status(404).json({ success: false, message: "Vehicle to delete not found" });
        }

        res.status(200).json({
            success: true,
            message: "Vehicle deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Deletion failed", error: error.message });
    }
};