import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true, 
        index: true 
    },
    bookingId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Booking", 
        required: true 
    },
    amount: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    currency: { 
        type: String, 
        default: "LKR" 
    },
    paymentMethod: { 
        type: String, 
        enum: ["card", "bank_transfer", "crypto"], 
        required: true 
    },


    transactionId: { 
        type: String,
        default: null
    },
    // ─────────────────────────────────────────────────────────────────────────

    paymentStatus: { 
        type: String, 
        enum: ["pending", "processing", "completed", "failed", "refunded", "cancel_requested"], 
        default: "pending" 
    },
    receiptUrl: { 
        type: String 
    },
    paymentDetails: {
        bankName:    String,
        paymentDate: Date,
        paidAmount:  Number
    },
    aiVerification: {
        isReceipt:         Boolean,
        paymentConfirmed:  Boolean,
        extractedAmount:   Number,
        extractedCurrency: String,
        transactionId:     String,
        paymentDate:       String,
        confidence:        Number,
        reason:            String,
        verifiedAt:        Date,
        verifiedBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User" 
        }
    },
    metadata: { 
        adminNotes:   String, 
        cancelReason: String 
    }
}, { timestamps: true });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;