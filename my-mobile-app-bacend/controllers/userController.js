import bcrypt from 'bcryptjs';
import User from "../models/User.js"; 
import jwt from "jsonwebtoken";
import axios from "axios";
import crypto from "crypto";
import Otp from '../models/Otp.js';
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// 1. Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    },
    tls: {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2"
    }
});

// 2. Middleware: Check if Admin (Routes )
export const isAdmin = (req, res, next) => {
    // req.user protect middleware 
    if (req.user && req.user.role === "admin") {
        console.log("Access Granted: User is Admin");
        next();
    } else {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
};

// 3. User Registration
export async function registerUser(req, res) {
    try {
        const data = req.body;

        const existingUser = await User.findOne({ email: data.email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        const hashedPassword = bcrypt.hashSync(data.password, 10);

        const newUser = new User({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: hashedPassword,      
            image: data.image || "/default-profile.png",
            address: data.address || "",
            phone: data.phone || "",
            role: data.role || "user" ,// Default role- user 
            interests: data.interests || [], // Default interests- empty array

        });

        const result = await newUser.save();
        res.status(201).json({
            message: "User created successfully",
            user: result,
        });

    } catch (err) {
        console.error("Register Error:", err); 
        res.status(500).json({ message: "Error creating user", error: err.message });
    }
}

// 4. User Login (Token - Based Authentication)
export function loginUser(req, res) {
    const { email, password } = req.body;

    User.findOne({ email: email }).then((user) => {
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        if(user.isblocked){
            return res.status(403).json({ message: "Your account is blocked. Please contact support." });
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (isPasswordValid) {
            // Token Payload  - 
            const payload = {
                id: user._id,
                email: user.email,
                role: user.role, // "admin" or "user"
                isAdmin: user.role === "admin",
                firstName: user.firstName,
                lastName: user.lastName,
                image: user.image
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7h' });
            
            res.json({
                message: "User logged in successfully",
                token: token,
                role: user.role,
            });
        } else {
            res.status(401).json({ message: "Invalid password" });
        }
    }).catch((err) => {
        res.status(500).json({ message: "Error logging in user", error: err.message });
    });
}

// 5. Google Login (Token 
export async function googlelogin(req, res) {
    const accessToken = req.body.token;
    if (!accessToken) return res.status(400).json({ message: "Missing Google access token" });

    try {
        const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const googleUser = response.data;
        let user = await User.findOne({ email: googleUser.email });

        if (!user) {
            const randomPassword = crypto.randomBytes(32).toString("hex");
            const hashedPassword = bcrypt.hashSync(randomPassword, 10);
            user = new User({
                email: googleUser.email,
                firstName: googleUser.given_name || googleUser.name || "Google",
                lastName: googleUser.family_name || "User",
                password: hashedPassword,
                image: googleUser.picture || "/default.jpg",
                isemailverified: true,
                role: "user" 
            });
            await user.save();
        }

        if(user.isblocked){
            return res.status(403).json({ message: "Your account is blocked." });
        }

        const payload = {
            id: user._id,
            email: user.email,
            role: user.role,
            isAdmin: user.role === "admin",
            firstName: user.firstName,
            image: user.image
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
        return res.json({ message: "Login successful", token, role: user.role });
    } catch (error) {
        return res.status(500).json({ message: "Google login failed", error: error.message });
    }
}



export async function getuser(req, res) {
    try {
        console.log("📋 getuser called - req.user:", req.user);
        
        if (!req.user?.email) {
            console.error("❌ Missing email in req.user:", req.user);
            return res.status(401).json({ message: "Unauthorized - no email in token" });
        }

        console.log("🔍 Fetching user with email:", req.user.email);
        const user = await User.findOne({ email: req.user.email });
        
        if (!user) {
            console.warn("⚠️ User not found for email:", req.user.email);
            return res.status(404).json({ message: "User not found" });
        }
        
        console.log("✅ User fetched successfully:", user._id);
        res.json(user);
    } catch (error) {
        console.error("❌ Error in getuser:", {
            message: error.message,
            stack: error.stack,
            userEmail: req.user?.email
        });
        res.status(500).json({ 
            message: "Error fetching user", 
            error: error.message,
            details: error.stack 
        });
    }
}

export async function getAllUsers(req,res){
    try{
        const users = await User.find();
        res.json(users);
    } catch(error){
        res.status(500).json({message:"Failed to fetch users",error:error.message})
    }
}

export async function deleteUser(req,res){
    const email = req.params.email;
    try{
        const result = await User.deleteOne({email:email});
        if(result.deletedCount === 0) return res.status(404).json({message:"User not found"});
        res.json({message:"User deleted successfully"});
    } catch(error){
        res.status(500).json({message:"Error deleting user",error:error.message});
    }
}

export async function sendOtp(req, res) {
    const email = req.params.email;
    try {
        const user = await User.findOne({ email: email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        await Otp.findOneAndDelete({ email: email });
        const newOtpEntry = new Otp({ email, otp: generatedOtp, otpExpiry });
        await newOtpEntry.save();

        const mailOptions = {
            from: process.env.EMAIL, 
            to: email,
            subject: "Password Reset OTP",
            text: `Your OTP is: ${generatedOtp}`
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) return res.status(500).json({ message: "Error sending OTP" });
            return res.json({ message: "OTP sent successfully!" });
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export async function validateOtp(req,res){
    try{
        const {email,otp,newPassword} = req.body;
        const otpEntry = await Otp.findOne({email, otp});
        if(!otpEntry) return res.status(400).json({message:"Invalid OTP"});

        await Otp.deleteOne({email, otp});
        const hashedPassword = bcrypt.hashSync(newPassword,10);
        await User.updateOne({email},{$set:{password:hashedPassword, isemailverified:true}});
        res.json({message:"Password reset successful"});
    } catch(error){
        res.status(500).json({message:"Server error",error:error.message})
    }
}

export async function updateUserStatus(req, res) {
    const email = req.params.email;
    const isBlockValue = req.body.isblocked;
    try {
        const result = await User.updateOne({ email }, { $set: { isblocked: isBlockValue } });
        if (result.matchedCount === 0) return res.status(404).json({ message: "User not found" });
        res.json({ message: "User status updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error updating status", error: error.message });
    }
}

export async function updateUserRole(req,res){
    const email = req.params.email;
    const newRole = req.body.role;
    try{
        const result = await User.updateOne({email},{$set:{role:newRole}});
        if(result.matchedCount === 0) return res.status(404).json({message:"User not found"});
        res.json({message:"User role updated successfully"});
    }catch(error){
        res.status(500).json({message:"Error updating role",error:error.message});
    }
}

export const updateUser = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (user) {
            user.firstName = req.body.firstName || user.firstName;
            user.lastName = req.body.lastName || user.lastName;
            user.phone = req.body.phone || user.phone;
            user.address = req.body.address || user.address;
            user.image = req.body.image || user.image;

            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: "User not found" });
            
        }
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};