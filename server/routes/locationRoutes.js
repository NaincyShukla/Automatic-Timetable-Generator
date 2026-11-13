const express = require("express");

const router = express.Router();

const {
  addLocation,
  getLocations,
  deleteLocation,
} = require("../controllers/locationController");

// GET all locations
router.get("/", getLocations);

// ADD new location
router.post("/", addLocation);

// DELETE location
router.delete("/:id", deleteLocation);

module.exports = router;