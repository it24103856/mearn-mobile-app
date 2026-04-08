import express, {Router} from 'express';
import { createDriver, getDriver, deleteDriver, updateDriver,getAllDrivers , getAllDriversed } from '../controllers/driverController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router=express.Router();

//get driver by email
router.get('/get/:email', getDriver);
router.get('/customer/get-all', getAllDriversed);

//create driver
router.post('/create', protect, isAdmin, createDriver);

//get all drivers(admin)
router.get('/get-all', protect, getAllDrivers);



//update driver
router.put('/update/:email', protect, isAdmin, updateDriver);

//delete driver
router.delete('/delete/:email', protect, isAdmin, deleteDriver);

export default router;