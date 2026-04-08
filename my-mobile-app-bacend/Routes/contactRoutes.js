import express, { Router } from 'express';
import { createContact, getContct,deleteContact,updateContact,sendMessage,getAllMessage,deleteMessage ,replyToMessage,getCustomerMessages,markAsViewedByCustomer,getMyMessages} from '../controllers/contactController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

//oni kenekta puluwan
router.get('/get', getContct);
router.post("/send-message",sendMessage)

//admin kenekta withari puluwan 

router.post('/create', protect, isAdmin, createContact);
router.delete('/delete/:id', protect, isAdmin, deleteContact);
router.put('/update/:id', protect, isAdmin, updateContact);
router.get("/messages",protect,isAdmin,getAllMessage)
router.delete("/delete-message/:id", protect, isAdmin, deleteMessage);
router.put("/reply-message/:id", protect, isAdmin, replyToMessage);
router.get("/my-messages/:email", getCustomerMessages);
router.get("/my-messages", protect, getMyMessages);
// Add this to your contactRouter.js
router.put("/mark-viewed/:id", markAsViewedByCustomer);

export default router;