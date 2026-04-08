import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";
import dns from "node:dns";

// 1. Routes Imports
import userRoutes from "./Routes/userRoutes.js";
import contactRoutes from "./Routes/contactRoutes.js";
import driverRoutes from "./Routes/driverRoutes.js";
import hotelRouter from "./Routes/hotelRoutes.js";
import feedbackRoutes from "./Routes/feedbackRoutes.js";
import BookingRoutes from "./Routes/bookingRoutes.js";
import paymentRoutes from "./Routes/paymentRoutes.js";
import packageRoutes from "./Routes/packageRoutes.js";
import destinationRoutes from "./Routes/destinationRoutes.js";
import vehicleRoutes from "./Routes/vehicleRoutes.js";
import reviewRoutes from "./Routes/reviewRoutes.js";

// Mongo_Url="mongodb+srv://admin:123@cluster0.cf19ams.mongodb.net/?appName=Cluster0"


// DNS Configuration
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// 2. Initializing App & Environment
dotenv.config();
const app = express();
const PORT = 3000;
const mongourl = process.env.Mongo_Url;

// 3. Database Connection
mongoose.connect(mongourl)
    .then(() => {
        console.log("✅ Connected to MongoDB successfully");
    })
    .catch((err) => {
        console.log("❌ DB Connection Error: " + err);
    });

// 4. Middlewares
app.use(cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// 5. Auth Middleware (Token Verification)
app.use((req, res, next) => {
    const authorizationHeader = req.header("Authorization");
    
    if (authorizationHeader) {
        const token = authorizationHeader.replace("Bearer ", "");
        
        jwt.verify(token, process.env.JWT_SECRET, (error, content) => {
            if (error) {
                // Invalid token - silent fail to allow public routes
            } else if (content) {
                req.user = content; // Store user details in request
            }
        });
    }
    next();
});

// 6. Routes Configuration
app.use("/api/users", userRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/hotels", hotelRouter);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/bookings", BookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/reviews", reviewRoutes);

// 7. Health Check Route (Optional)
app.get("/", (req, res) => {
    res.send("Travel Agency API is Running...");
});

// 8. Server Startup

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is running on http://192.168.8.136:${PORT}`);
});