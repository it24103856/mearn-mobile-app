import Contact from "../models/Contact.js";
import Message from "../models/Message.js";
import nodemailer from "nodemailer";

// Nodemailer Transporter Configuration
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD, // Use App Password here
    },
});

// @desc    Create a new contact record
// @route   POST /api/contact/create
export const createContact = async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;

        // Check if contact with the same email already exists
        const existingContact = await Contact.findOne({ email });
        if (existingContact) {
            return res.status(400).json({ message: "Contact with this email already exists" });
        }

        const newContact = new Contact({ name, email, phone, address });
        const savedContact = await newContact.save();

        res.status(201).json({ message: "Contact created successfully", data: savedContact });
    } catch (error) {
        res.status(500).json({ message: "Creation failed", error: error.message });
    }
};

// @desc    Get the first contact record
// @route   GET /api/contact
export const getContct = async (req, res) => {
    try {
        const contact = await Contact.findOne(); 
        if (!contact) {
            return res.status(404).json({ message: "Contact info not found" });
        }
        res.status(200).json({ message: "Contact fetched successfully", data: contact });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch contact", error: error.message });
    }
};

// @desc    Update contact record by ID
// @route   PUT /api/contact/update/:id
export const updateContact = async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        const updatedContact = await Contact.findByIdAndUpdate(
            req.params.id,
            { name, email, phone, address },
            { new: true, runValidators: true }
        );

        if (!updatedContact) {
            return res.status(404).json({ message: "Contact not found" });
        }
        res.status(200).json({ message: "Contact updated successfully", data: updatedContact });
    } catch (error) {
        res.status(500).json({ message: "Failed to update contact", error: error.message });
    }
};

// @desc    Delete contact record by ID
// @route   DELETE /api/contact/delete/:id
export const deleteContact = async (req, res) => {
    try {
        const deletedContact = await Contact.findByIdAndDelete(req.params.id);
        if (!deletedContact) {
            return res.status(404).json({ message: "Contact not found" });
        }
        res.status(200).json({ message: "Contact deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete contact", error: error.message });
    }
};

// @desc    Customer sends a message & receives confirmation email
// @route   POST /api/contact/send-message
export const sendMessage = async (req, res) => {
    try {
        const { customerId, customerName, customerEmail, subject, message } = req.body;

        // 1. Save message to Database
        const newMessage = new Message({
            customerId: customerId || null,
            firstName: customerName, // Maps customerName to firstName in Model
            customerEmail,
            subject,
            message
        });
        await newMessage.save();

        // 2. Send confirmation email to Customer
        const mailOptions = {
            from: `"Support Team" <${process.env.EMAIL}>`,
            to: customerEmail,
            subject: `Message Received: ${subject}`,
            text: `Hi ${customerName}, we have received your message and will get back to you soon.`,
            html: `<h3>Hello ${customerName}</h3><p>We received your message regarding <b>${subject}</b>.</p><p>Message: ${message}</p>`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Message sent successfully and email delivered" });
    } catch (error) {
        console.error("SendMessage Error:", error);
        res.status(500).json({ message: "Failed to send message", error: error.message });
    }
};

// @desc    Get all messages for Admin (Sorted by newest)
// @route   GET /api/contact/all-messages
export const getAllMessage = async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        res.status(200).json({ data: messages });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Delete message by ID
// @route   DELETE /api/contact/message/:id
export const deleteMessage = async (req, res) => {
    try {
        const deletedMessage = await Message.findByIdAndDelete(req.params.id);
        if (!deletedMessage) {
            return res.status(404).json({ message: "Message not found" });
        }
        res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete message", error: error.message });
    }
};

// @desc    Admin replies to a message & sends email to Customer
// @route   POST /api/contact/reply/:id
export const replyToMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminReply } = req.body;

        const updatedMessage = await Message.findByIdAndUpdate(
            id,
            { adminReply, isRead: true },
            { new: true }
        );

        if (!updatedMessage) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Send reply email to Customer
        const mailOptions = {
            from: `"Support Team" <${process.env.EMAIL}>`,
            to: updatedMessage.customerEmail,
            subject: `Reply to: ${updatedMessage.subject}`,
            html: `<p><b>Our Reply:</b></p><p>${adminReply}</p><hr/><p>Original Message: ${updatedMessage.message}</p>`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Reply sent successfully!", data: updatedMessage });
    } catch (error) {
        res.status(500).json({ message: "Failed to send reply", error: error.message });
    }
};

// @desc    Get messages belonging to a specific customer email
// @route   GET /api/contact/customer-messages/:email
export const getCustomerMessages = async (req, res) => {
    try {
        const { email } = req.params;
        const messages = await Message.find({ customerEmail: email }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Mark a message as viewed by the customer
// @route   PATCH /api/contact/view-message/:id
export const markAsViewedByCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedMessage = await Message.findByIdAndUpdate(
            id,
            { isViewedByCustomer: true },
            { new: true }
        );

        if (!updatedMessage) {
            return res.status(404).json({ message: "Message not found" });
        }
        res.status(200).json({ success: true, message: "Marked as viewed" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get messages for authenticated user
// @route   GET /api/contact/my-messages
export const getMyMessages = async (req, res) => {
    try {
        const userEmail = req.user?.email;
        
        if (!userEmail) {
            return res.status(401).json({ success: false, error: "Unauthorized - user email not found" });
        }

        const messages = await Message.find({ customerEmail: userEmail }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};