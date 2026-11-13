const Setting = require("../models/Settings");

// Get Settings
const getSettings = async (req, res) => {
    try {

        const { userId } = req.query;

        let settings = await Setting.findOne({ userId });

        if (!settings) {

            settings = await Setting.create({
                userId,
            });

        }

        res.json(settings);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: err.message,
        });

    }
};

// Save / Update Settings
const updateSettings = async (req, res) => {

    try {

        console.log("========== SETTINGS UPDATE ==========");
        console.log("Incoming Body:");
        console.log(req.body);

        const { userId } = req.body;

        if (!userId) {

            return res.status(400).json({
                message: "User ID is missing"
            });

        }

        const settings = await Setting.findOneAndUpdate(

            { userId },

            req.body,

            {
               returnDocument: "after",
                upsert: true,
                runValidators: true
            }

        );

        console.log("Saved Document:");
        console.log(settings);

        console.log("=====================================");

        res.json(settings);

    } catch (err) {

        console.log("Settings Update Error:");
        console.log(err);

        res.status(500).json({
            message: err.message,
        });

    }

};

module.exports = {
    getSettings,
    updateSettings,
};