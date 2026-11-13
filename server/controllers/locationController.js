const Location = require("../models/Location");

// Get all locations
const getLocations = async (req, res) => {

    try {

        const locations = await Location.find().sort({ roomNo: 1 });

        res.json(locations);

    } catch (err) {

        res.status(500).json({
            message: err.message,
        });

    }

};

// Add location
const addLocation = async (req, res) => {

    try {

        const location = new Location(req.body);

        const savedLocation = await location.save();

        res.status(201).json(savedLocation);

    } catch (err) {

        res.status(400).json({
            message: err.message,
        });

    }

};

// Delete location
const deleteLocation = async (req, res) => {

    try {

        const location = await Location.findByIdAndDelete(req.params.id);

        if (!location) {

            return res.status(404).json({
                message: "Location not found",
            });

        }

        res.json({
            message: "Location deleted successfully",
        });

    } catch (err) {

        res.status(500).json({
            message: err.message,
        });

    }

};

module.exports = {
    getLocations,
    addLocation,
    deleteLocation,
};