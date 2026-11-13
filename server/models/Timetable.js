const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema({

    division: {
        type: String,
        required: true
    },

    day: {
        type: String,
        required: true
    },

    startTime: {
        type: String,
        required: true
    },

    endTime: {
        type: String,
        required: true
    },

    subject: {
        type: String,
        required: true
    },

    teacher: {
        type: String,
        required: true
    },

    room: {
        type: String,
        required: true
    },

    roomType: {
        type: String,
        enum: ["Classroom", "Lab"],
        default: "Classroom"
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Timetable", timetableSchema);