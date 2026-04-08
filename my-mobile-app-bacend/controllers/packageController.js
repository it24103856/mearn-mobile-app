import Package from "../models/Package.js";

// --- Create Package ---
export const createPackage = async (req, res) => {
    try {
        const { title, description, price, no_of_days } = req.body;

        if (!title) return res.status(400).json({ success: false, message: "Title is required" });
        if (!description) return res.status(400).json({ success: false, message: "Description is required" });
        if (!price) return res.status(400).json({ success: false, message: "Price is required" });
        if (!no_of_days) return res.status(400).json({ success: false, message: "Number of days is required" });

        const newPackage = new Package({
            ...req.body,
            gallery:          req.body.gallery          || [],
            itineraries:      req.body.itineraries      || [],
            faqs:             req.body.faqs             || [],
            traveller_tips:   req.body.traveller_tips   || [],
            transport:        req.body.transport        || [],
            categories:       req.body.categories       || [],
            destinations:     req.body.destinations     || [],   // Array of ObjectIds
            included_hotels:  req.body.included_hotels  || [],   // Array of ObjectIds
        });

        await newPackage.save();
        res.status(201).json({ success: true, data: newPackage });
    } catch (error) {
        console.error("Create Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Update Package ---
export const updatePackage = async (req, res) => {
    try {
        let updateData = req.body;

        if (updateData.itineraries) {
            updateData.itineraries = updateData.itineraries.map(itinerary => ({
                ...itinerary,
                activities: itinerary.activities || []
            }));
        }

        // Ensure relation arrays are always arrays
        if (updateData.destinations)    updateData.destinations    = updateData.destinations    || [];
        if (updateData.included_hotels) updateData.included_hotels = updateData.included_hotels || [];

        const updatedPackage = await Package.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        )
        .populate("destinations",    "name image description")   // Destination fields populate
        .populate("included_hotels", "name images city district rating roomTypes"); // Hotel fields populate

        if (!updatedPackage) {
            return res.status(404).json({ success: false, message: "Package not found" });
        }

        res.status(200).json({ success: true, data: updatedPackage });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Delete Package ---
export const deletePackage = async (req, res) => {
    try {
        const deletedPackage = await Package.findByIdAndDelete(req.params.id);

        if (!deletedPackage) {
            return res.status(404).json({ success: false, message: "Package not found" });
        }

        res.status(200).json({ success: true, message: "Package deleted successfully" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Get All Packages ---
export const getAllPackages = async (req, res) => {
    try {
        const packages = await Package.find()
            .populate("destinations",    "name image description")   // Destination details populate
            .populate("included_hotels", "name images city district rating roomTypes") // Hotel details populate
            .sort({ createdAt: -1 });                                  // Newest first

        res.status(200).json({ success: true, data: packages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Get Single Package ---
export const getSinglePackage = async (req, res) => {
    try {
        const package_ = await Package.findById(req.params.id)
            .populate("destinations",    "name image description")   // Destination details populate
            .populate("included_hotels", "name images city district rating roomTypes"); // Hotel details populate

        if (!package_) {
            return res.status(404).json({ success: false, message: "Package not found" });
        }

        res.status(200).json({ success: true, data: package_ });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};