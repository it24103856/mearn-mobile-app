import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import { analyzeReceiptWithGemini } from "../services/geminiReceiptService.js";


export const createManualPayment = async (req, res) => {
    console.log("🔥 createManualPayment called with body:", req.body);
  try {
    const {
      bookingId,
      amount,
      paymentMethod,
      receiptUrl,
      paymentDetails,
      transactionId,
    } = req.body;

    // Basic validation
    if (!bookingId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: bookingId, amount, paymentMethod.",
      });
    }

    // Create the payment document (initially with status "processing")
    const newPayment = new Payment({
      userId: req.user.id,
      bookingId,
      amount,
      paymentMethod,
      transactionId: transactionId || null,
      receiptUrl: receiptUrl || null,
      paymentDetails: {
        bankName: paymentDetails?.bankName || "Manual Payment",
        paymentDate: paymentDetails?.paymentDate || new Date(),
        paidAmount: amount,
      },
      paymentStatus: "processing", // default
      metadata: { adminNotes: "Awaiting automatic AI verification" },
    });

    let aiVerificationResult = null;
    let aiNote = null;

    // If receipt URL exists, run AI verification
    if (receiptUrl) {
      try {
        console.log("🔍 Starting AI verification for receipt:", receiptUrl);
        // Call Gemini service to analyze the receipt
        aiVerificationResult = await analyzeReceiptWithGemini({
          receiptUrl,
          expectedAmount: amount,
          expectedCurrency: paymentDetails?.currency || "LKR",
        });
        console.log("✅ AI result:", JSON.stringify(aiVerificationResult, null, 2));

        // Store AI verification data in the payment document
        newPayment.aiVerification = {
          isReceipt: aiVerificationResult.isReceipt,
          paymentConfirmed: aiVerificationResult.paymentConfirmed,
          extractedAmount: aiVerificationResult.extractedAmount,
          extractedCurrency: aiVerificationResult.extractedCurrency,
          transactionId: aiVerificationResult.transactionId,
          paymentDate: aiVerificationResult.paymentDate,
          confidence: aiVerificationResult.confidence,
          reason: aiVerificationResult.reason,
          verifiedAt: new Date(),
          verifiedBy: req.user.id, // the user who uploaded the payment
        };

        // Decision logic: auto-approve if receipt is valid and amount matches (within tolerance)
        const tolerance = 1; // LKR
        const amountMatches =
          typeof aiVerificationResult.extractedAmount === "number" &&
          Math.abs(aiVerificationResult.extractedAmount - amount) <= tolerance;

        if (aiVerificationResult.isReceipt && aiVerificationResult.paymentConfirmed && amountMatches) {
          newPayment.paymentStatus = "completed";
          aiNote = "✅ AI auto-verified: Receipt valid and amount matches. Payment approved.";
          // Also update booking status to confirmed
          await Booking.findByIdAndUpdate(bookingId, { bookingStatus: "confirmed" });
        } else {
          // Verification failed – keep status as "processing" for manual review
          aiNote = `⚠️ AI could not auto-verify. Reason: ${aiVerificationResult.reason || "Amount mismatch or invalid receipt"}. Manual review required.`;
          newPayment.metadata.adminNotes = aiNote;
        }
      } catch (aiError) {
        console.error("❌ AI Verification Error details:", aiError.message);
        console.error(aiError.stack);
        aiNote = "❌ AI verification service failed. Payment will be reviewed manually.";
        newPayment.metadata.adminNotes = aiNote;
        // Keep payment status as "processing"
      }
    } else {
      aiNote = "No receipt uploaded. Payment requires manual verification.";
      newPayment.metadata.adminNotes = aiNote;
    }

    // Save the payment to database
    await newPayment.save();

    // Prepare response
    const responseData = {
      success: true,
      message: "Payment submitted successfully.",
      paymentId: newPayment._id,
      paymentStatus: newPayment.paymentStatus,
    };

    // Include AI note if available
    if (aiNote) {
      responseData.aiNote = aiNote;
    }
    if (aiVerificationResult) {
      responseData.aiVerification = {
        confidence: aiVerificationResult.confidence,
        amountMatched: Math.abs(aiVerificationResult.extractedAmount - amount) <= 1,
      };
    }

    res.status(201).json(responseData);
  } catch (error) {
    console.error("Create Payment Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const getAllPendingPayments = async (req, res) => {
    try {
        const pendingPayments = await Payment.find({ paymentStatus: "processing" })
            .populate("userId", "firstName email") 
            .populate("bookingId")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: pendingPayments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }   
};

export const updatePaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { status } = req.body;

        const payment = await Payment.findById(paymentId);
        if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

        payment.paymentStatus = status;
        await payment.save();

        if (status === "completed") {
            await Booking.findByIdAndUpdate(payment.bookingId, { bookingStatus: "confirmed" });
        }

        res.status(200).json({ success: true, message: "Payment and Booking status updated" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyPayments = async (req, res) => {
    try {
        const myPayments = await Payment.find({ userId: req.user.id })
            .populate("bookingId")
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: myPayments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const requestPaymentCancel = async (req, res) => {
    try {
        const { paymentId, reason } = req.body;
        const payment = await Payment.findOne({ _id: paymentId, userId: req.user.id });

        if (!payment) return res.status(404).json({ success: false, message: "Payment record not found." });
        
        payment.paymentStatus = "cancel_requested";
        if (!payment.metadata) payment.metadata = {};
        payment.metadata.cancelReason = reason || "Customer requested cancellation.";
        await payment.save();

        res.status(200).json({ success: true, message: "Cancellation request sent." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const approveCancelRequest = async (req, res) => {
    try {
        const { paymentId, status } = req.body; 
        const payment = await Payment.findById(paymentId);

        if (!payment || payment.paymentStatus !== "cancel_requested") {
            return res.status(400).json({ success: false, message: "No active cancellation request found." });
        }

        payment.paymentStatus = status;
        if (status === "refunded") {
            await Booking.findByIdAndUpdate(payment.bookingId, { bookingStatus: "cancelled" });
        }

        await payment.save();
        res.status(200).json({ success: true, message: `Payment ${status} successfully.` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deletePayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        await Payment.findByIdAndDelete(paymentId);
        res.status(200).json({ success: true, message: "Payment deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('userId', 'firstName email')
            .sort({ createdAt: -1 }); 
        res.status(200).json({ success: true, data: payments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyPaymentReceiptWithAI = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ success: false, message: "Payment not found" });
        }

        if (!payment.receiptUrl) {
            return res.status(400).json({ success: false, message: "No receipt URL found for this payment" });
        }

        const aiResult = await analyzeReceiptWithGemini({
            receiptUrl: payment.receiptUrl,
            expectedAmount: payment.amount,
            expectedCurrency: payment.currency,
        });

        const tolerance = 1;
        const amountMatched =
            typeof aiResult.extractedAmount === "number" &&
            Math.abs(aiResult.extractedAmount - payment.amount) <= tolerance;

        const shouldApprove = aiResult.isReceipt && aiResult.paymentConfirmed && amountMatched;

        payment.aiVerification = {
            ...aiResult,
            verifiedAt: new Date(),
            verifiedBy: req.user.id,
        };

        if (shouldApprove) {
            payment.paymentStatus = "completed";
            if (!payment.transactionId && aiResult.transactionId) {
                payment.transactionId = aiResult.transactionId;
            }
            await Booking.findByIdAndUpdate(payment.bookingId, { bookingStatus: "confirmed" });
        } else {
            payment.paymentStatus = "processing";
        }

        await payment.save();

        return res.status(200).json({
            success: true,
            message: shouldApprove
                ? "Receipt verified. Payment marked as completed."
                : "Receipt checked. Manual review still required.",
            data: {
                paymentId: payment._id,
                paymentStatus: payment.paymentStatus,
                amountMatched,
                aiVerification: payment.aiVerification,
            },
        });
    } catch (error) {
        console.error("AI Receipt Verification Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};