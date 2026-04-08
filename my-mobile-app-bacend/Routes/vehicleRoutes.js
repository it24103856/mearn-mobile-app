import express from "express";
import { 
    createVehicle, 
    getAllVehicles, 
    getVehicleById, 
    updateVehicle, 
    deleteVehicle 
} from "../controllers/vehicleController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js"; 

const router = express.Router();

// Public Routes: Viewing vehicles is open to all visitors
router.get("/", getAllVehicles);
router.get("/:id", getVehicleById);

// Protected Routes: Management actions restricted to Admins only
router.post("/", protect, isAdmin, createVehicle);
router.put("/:id", protect, isAdmin, updateVehicle);
router.delete("/:id", protect, isAdmin, deleteVehicle);

export default router;