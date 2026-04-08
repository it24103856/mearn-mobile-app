import mongoose from "mongoose"; // This must be included
import Booking from "../models/Booking.js";

// --- 1. Create New Booking ---
export const createBooking = async (req, res) => {
    try {
        // Ensure dates are properly converted to Date objects
        const bookingData = {
            ...req.body,
            checkIn: new Date(req.body.checkIn),
            checkOut: new Date(req.body.checkOut)
        };

        // Validate that dates were parsed correctly
        if (isNaN(bookingData.checkIn.getTime()) || isNaN(bookingData.checkOut.getTime())) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid date format. Use YYYY-MM-DD" 
            });
        }

        const newBooking = new Booking(bookingData);
        const savedBooking = await newBooking.save();
        res.status(201).json({ success: true, data: savedBooking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 2. Get All Bookings (Admin View) ---
export const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("hotelId", "name city") 
            .populate("packageId", "title")
            .populate("userId", "firstName lastName email") 
            .populate("driverId", "name phone") // Driver details
            .populate("vehicleId", "model licensePlate") // Vehicle details
            .sort({ createdAt: -1 }); 

        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 3. Get Single Booking ---
export const getSingleBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate("hotelId", "name city address phone email");

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        res.status(200).json({ success: true, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 4. Update Booking Status ONLY ---
export const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ["Pending", "Confirmed", "Cancelled"];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid status. Use Pending, Confirmed or Cancelled." 
            });
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            { $set: { status: status } }, 
            { new: true, runValidators: true }
        );

        if (!updatedBooking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        res.status(200).json({ 
            success: true, 
            message: `Booking has been ${status}`, 
            data: updatedBooking 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 5. Delete Booking ---
export const deleteBooking = async (req, res) => {
    try {
        const deletedBooking = await Booking.findByIdAndDelete(req.params.id);
        if (!deletedBooking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        res.status(200).json({ 
            success: true, 
            message: "Booking deleted successfully from database" 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 6. Get Bookings By User ID (Important section) ---
export const getBookingsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        // Remove ":" symbol from URL
        const cleanId = userId?.startsWith(":") ? userId.substring(1) : userId;

        // Check if ID is an ObjectId (to prevent crash)
        if (!mongoose.Types.ObjectId.isValid(cleanId)) {
            return res.status(400).json({ success: false, message: "Invalid User ID format" });
        }

        // Database Query - Convert String ID to ObjectId and search
        const customerBookings = await Booking.find({ 
            userId: new mongoose.Types.ObjectId(cleanId) 
        })
        .populate("hotelId") // Get Hotel details from here
        .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: customerBookings.length,
            data: customerBookings
        });

    } catch (error) {
        console.error("Critical Backend Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error", 
            error: error.message 
        });
    }
};