import express from "express";
import { 
    createPackage, 
    getAllPackages, 
    getSinglePackage, 
    updatePackage, 
    deletePackage 
} from "../controllers/packageController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Public Routes ---
router.get("/all", getAllPackages);
router.get("/get/:id", getSinglePackage);

// --- Admin Routes ---
// Create
router.post("/create", protect, isAdmin, createPackage);

// Update
router.put("/update/:id", protect, isAdmin, updatePackage);

// Delete
router.delete("/delete/:id", protect, isAdmin, deletePackage);

export default router;