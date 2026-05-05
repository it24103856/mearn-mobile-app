import express from 'express';
import { protect, isAdmin } from '../middleware/authMiddleware.js';
import { registerUser, loginUser, getuser, googlelogin,updateUser ,sendOtp,validateOtp,updateUserStatus,getAllUsers,deleteUser,updateUserRole} from '../controllers/userController.js';
const router = express.Router();

router.post('/create', registerUser);
router.post('/login', loginUser);
router.get('/isAdmin', protect, isAdmin);
router.get('/', protect, getuser);
router.post('/google-login', googlelogin);
router.post('/send-otp/:email', sendOtp)
router.post('/validate-otp', validateOtp);
router.put('/update-status/:email',protect,isAdmin, updateUserStatus);
router.get('/all-users', protect, isAdmin, getAllUsers);
router.delete('/delete-user/:email', protect, isAdmin, deleteUser);
router.put('/update-role/:email', protect, isAdmin, updateUserRole);
router.put('/update-profile/:email', protect, updateUser);


export default router;