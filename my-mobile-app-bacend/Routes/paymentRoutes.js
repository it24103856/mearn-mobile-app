import express from "express";
import { 
    createManualPayment, 
    getAllPendingPayments, 
    updatePaymentStatus, 
    getMyPayments, 
    requestPaymentCancel, 
    approveCancelRequest ,
    deletePayment,
    getAllPayments,
    verifyPaymentReceiptWithAI
} from "../controllers/paymentController.js";
import { isAdmin,protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ---  (Customer)  Routes ---

// 1.  (Manual Payment Upload)
router.post("/create", protect, createManualPayment);

// 2. my payments list
router.get("/my-payments", protect, getMyPayments);

// 3. Payment cancel request
router.post("/request-cancel", protect, requestPaymentCancel);


// ---  (Admin)  Routes ---

// 4. Pending Payments List
router.get("/admin/pending", protect, isAdmin, getAllPendingPayments);

// 5.  (Status)  (Approve/Reject)
router.put("/admin/update-status/:paymentId", protect, isAdmin, updatePaymentStatus);



// 6.  (Refund Approve)
router.put("/admin/approve-cancel", protect, isAdmin, approveCancelRequest);

// 7.  (Delete Payment)
router.delete("/admin/delete/:paymentId", protect, isAdmin, deletePayment);

// 8.  (Get All Payments)  (Admin)
router.get("/admin/all", protect, isAdmin, getAllPayments);

// 9. AI Receipt Verify (Admin)
router.post("/admin/verify-receipt/:paymentId", protect, isAdmin, verifyPaymentReceiptWithAI);

export default router;