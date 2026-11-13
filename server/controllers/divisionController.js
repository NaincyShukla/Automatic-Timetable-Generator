const Division = require("../models/Division");

// Get all divisions
const getDivisions = async (req, res) => {
  try {
    const divisions = await Division.find();
    res.json(divisions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add division
const addDivision = async (req, res) => {
  try {
    const division = await Division.create(req.body);
    res.status(201).json(division);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete division
const deleteDivision = async (req, res) => {
  try {
    await Division.findByIdAndDelete(req.params.id);
    res.json({ message: "Division deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getDivisions,
  addDivision,
  deleteDivision,
};