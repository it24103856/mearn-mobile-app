import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
    time: {
        type: String,
        required: true
    },
    task: {
        type: String,
        required: true
    }
});

const itinerarySchema = new mongoose.Schema({
    day_no: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    activities: [activitySchema]
});

const faqSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    }
});

const travellerTipSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    }
});

const packageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    categories: {
        type: [String],
        default: []
    },
    price: {
        type: Number,
        required: true
    },
    no_of_days: {
        type: Number,
        required: true
    },

    // --- Itineraries Section ---
    itineraries: [itinerarySchema],

    destinations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Destination"
    }],
    included_hotels: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hotel"
    }],
    transport: {
        type: [String],
        default: []
    },
    gallery: {
        type: [String],
        default: []
    },

    // --- FAQs Section ---
    faqs: [faqSchema],

    // --- Traveller Tips Section ---
    traveller_tips: [travellerTipSchema]
});

export default mongoose.model("Package", packageSchema);