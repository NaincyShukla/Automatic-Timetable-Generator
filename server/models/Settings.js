const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    institutionName: {
        type: String,
        default: ""
    },


    workingDays: {
        type: [String],
        default: ["Monday","Tuesday","Wednesday","Thursday","Friday"]
    },

    collegeStartTime: {
        type: String,
        default: "7:30"
    },

    collegeEndTime: {
        type: String,
        default: "1:30"
    },

    breakStart: {
        type: String,
        default: "10:30"
    },

    breakEnd: {
        type: String,
        default: "11:00"
    },

    darkMode: {
        type: Boolean,
        default: false
    }

});

module.exports = mongoose.model("Setting", settingSchema);