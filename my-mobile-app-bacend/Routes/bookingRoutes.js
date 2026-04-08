import express from "express";
import { 
    createBooking,
    getAllBookings, // Get all bookings
    getSingleBooking, 
    updateBookingStatus, 
    deleteBooking ,
    getBookingsByUserId
} from "../controllers/bookingController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Public Routes ---
router.post("/create", createBooking); // Allow customer to create a booking

// --- Admin Only Routes ---
// 1. View all bookings (needed to display in a table)
router.get("/all", protect, isAdmin, getAllBookings); 

// 2. View details of a specific booking
router.get("/get/:id", protect, getSingleBooking);

// 3. Change status (Pending/Confirmed/Cancelled)
router.put("/update-status/:id", protect, isAdmin, updateBookingStatus);

// 4. Delete a booking
router.delete("/delete/:id", protect, deleteBooking);

router.get("/user/:userId", getBookingsByUserId);
export default router;