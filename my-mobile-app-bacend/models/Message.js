// models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        required: false 
    },
    firstName: {
        type: String,
        required: true
    },
    customerEmail: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    adminReply: {
        type: String, 
        default: ""
    }, 
    isRead: { 
        type: Boolean,
        default: false
    },
    isViewedByCustomer: { 
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);