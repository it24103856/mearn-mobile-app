import express from 'express';
import {createDestination,getAllDestinations,getDestinationById,updateDestination,deleteDestination } from '../controllers/destinationController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';
import {Router} from 'express';

const router=express.Router();

//public routes
router.get("/all",getAllDestinations);
router.get("/:id",getDestinationById);

//admin routes
router.post("/create",protect,isAdmin,createDestination);
router.put("/update/:id",protect,isAdmin,updateDestination);
router.delete("/delete/:id",protect,isAdmin,deleteDestination);

export default router;
