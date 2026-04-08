import Hotel from "../models/Hotel.js";

// --- Create Hotel ---
export const createHotel = async (req, res) => {
    try {
        const { roomTypes, description } = req.body;

        // Validation
        if (!description) {
            return res.status(400).json({ success: false, message: "Description is required" });
        }

        // Room calculations & image handling
        const updatedRoomTypes = roomTypes.map(room => {
            const originalPrice = Number(room.originalPrice) || 0;
            const discountPercentage = Number(room.discountPercentage) || 0;
            const discountAmount = (originalPrice * discountPercentage) / 100;
            
            return {
                ...room,
                discount: discountAmount,
                finalPrice: originalPrice - discountAmount,
                images: room.images || [] // Frontend 
            };
        });

        const newHotel = new Hotel({
            ...req.body,
            roomTypes: updatedRoomTypes
        });

        await newHotel.save();
        res.status(201).json({ success: true, data: newHotel });
    } catch (error) {
        console.error("Create Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Update Hotel ---
export const updateHotel = async (req, res) => {
    try {
        let updateData = req.body;

        // Room updates handle 
        if (updateData.roomTypes) {
            updateData.roomTypes = updateData.roomTypes.map(room => {
                const originalPrice = Number(room.originalPrice) || 0;
                const discountPercentage = Number(room.discountPercentage) || 0;
                const discountAmount = (originalPrice * discountPercentage) / 100;

                return { 
                    ...room, 
                    discount: discountAmount, 
                    finalPrice: originalPrice - discountAmount,
                    images: room.images || [] // Existing  New image URLs 
                };
            });
        }

        const updatedHotel = await Hotel.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true, runValidators: true }
        );

        if (!updatedHotel) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }

        res.status(200).json({ success: true, data: updatedHotel });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Delete Hotel ---
export const deleteHotel = async (req, res) => {
    try {
        const deletedHotel = await Hotel.findByIdAndDelete(req.params.id);
        
        if (!deletedHotel) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }
        res.status(200).json({ success: true, message: "Hotel deleted successfully" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Get All Hotels ---
export const getAllHotels = async (req, res) => {
    try {
        const hotels = await Hotel.find().sort({ createdAt: -1 }); // Show newest ones at the top
        res.status(200).json({ success: true, data: hotels });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Get Single Hotel ---
export const getSingleHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }
        res.status(200).json({ success: true, data: hotel });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};