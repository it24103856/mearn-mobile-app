import express, {Router} from 'express';
import { createDriver, getDriver, deleteDriver, updateDriver,getAllDrivers , getAllDriversed } from '../controllers/driverController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router=express.Router();

// PUBLIC ENDPOINTS - No auth required
router.get('/get/:email', getDriver);
router.get('/customer/get-all', getAllDriversed);

// PROTECTED ENDPOINTS - Admin only
router.post('/create', protect, isAdmin, createDriver);
router.get('/get-all', protect, getAllDrivers);
router.put('/update/:email', protect, isAdmin, updateDriver);
router.delete('/delete/:email', protect, isAdmin, deleteDriver);

export default router;