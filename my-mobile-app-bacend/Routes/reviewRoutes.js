import express from "express";
import { 
    createReview, 
    getHotelReviews, 
    getPackageReviews 
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createReview);
router.get("/hotel/:hotelId", getHotelReviews);
router.get("/package/:packageId", getPackageReviews); 

export default router;