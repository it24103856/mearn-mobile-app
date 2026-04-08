import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    type: { 
        type: String, 
        required: true, 
        enum: ["Single", "Double", "Family", "Suite", "Luxury"] 
    },
    maxGuests: { 
        type: Number, 
        required: true 
    },
    originalPrice: { 
        type: Number, 
        required: true 
    },
    discountPercentage: { 
        type: Number,
         default: 0 
        },
    finalPrice: { 
        type: Number, 
        required: true 
    },
    availability: {
         type: Boolean,
          default: true 
        },
        images: {
             type: [String],
              default: [] 
            },
    features: [String] // ["AC", "Sea View", "King Bed"]

});

const hotelSchema = new mongoose.Schema({
    hotelID: {
         type: String,
          required: true, 
          unique: true
         },
    name: {
         type: String,
         required: true
         },
    address: { 
        type: String,
         required: true 
        },
    city: { 
        type: String,
         required: true
         },
    province: {
         type: String,
          required: true
         },
    district: { 
        type: String,
         required: true
         },
    phone: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String,
         required: true 
        },
    description: { 
        type: String,
         required: true
         },
    images: {
         type: [String],
          default: [] 
        },
    
    // --- Room Types Section ---
   
    roomTypes: [roomSchema], 

    amenities: {
        type: [String], 
        default: []
    },
    category: {
        type: String,
        enum: ["Luxury", "Budget", "Boutique", "Resort"],
        default: "Budget"
    },
    rating: { type: Number, default: 5 }
});

export default mongoose.model("Hotel", hotelSchema);