const mongoose = require("mongoose");

const divisionSchema = new mongoose.Schema(
  {
    divisionName: {
      type: String,
      required: true,
    },

    semester: {
      type: Number,
      required: true,
    },

    
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Division", divisionSchema);