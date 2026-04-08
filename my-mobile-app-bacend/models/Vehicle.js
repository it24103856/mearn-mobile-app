import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
    // Basic Information
    type: { 
        type: String, 
        required: true,
        enum: ['Car', 'Van', 'SUV', 'Bus'], 
    },
    make: { // Manufacturer (e.g., Toyota, Honda)
        type: String,
        required: true
    },
    model: { // Vehicle Model (e.g., Prius, KDH)
        type: String,
        required: true
    },
    registrationNumber: { // Unique License Plate Number
        type: String,
        required: true,
        unique: true, 
        trim: true
    },

    // Capacity & Features
    seatingCapacity: { 
        type: Number,
        required: true,
        min: 1
    },
    luggageCapacity: { 
        type: String,
        required: false 
    },
    hasAC: { 
        type: Boolean,
        default: true
    },
    fuelType: { 
        type: String,
        enum: ['Petrol', 'Diesel', 'Hybrid', 'EV'],
        required: true
    },

    // Pricing & Media
    pricePerKm: { 
        type: Number,
        required: true,
        min: 0
    },
    images: [{ // Array of Image URLs
        type: String,
        required: true
    }],

    // Availability & Relationships
    isAvailable: { 
        type: Boolean,
        default: true
    },
    driverId: { // Reference to Driver Model
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: false 
    }
}, {
    timestamps: true // Auto-manages createdAt and updatedAt fields
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;