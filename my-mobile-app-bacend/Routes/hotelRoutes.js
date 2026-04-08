import express from "express";
import { 
    createHotel, 
    getAllHotels, 
    getSingleHotel, 
    updateHotel, 
    deleteHotel 
} from "../controllers/hotelController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Public Routes ---
router.get("/all", getAllHotels);
router.get("/get/:id", getSingleHotel);

// --- Admin Routes ) ---
// Create
router.post("/create",protect,isAdmin, createHotel);

// Update
router.put("/update/:id", protect, isAdmin, updateHotel);

// Delete
router.delete("/delete/:id", protect, isAdmin, deleteHotel);

export default router;