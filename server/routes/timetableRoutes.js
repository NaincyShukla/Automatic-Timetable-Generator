/**
 * timetableRoutes.js
 * ----------------------------------------------------------------------
 * Mount in your main app with:
 *   const timetableRoutes = require("./routes/timetableRoutes");
 *   app.use("/api/timetable", timetableRoutes);
 * ----------------------------------------------------------------------
 */

const express = require("express");
const router = express.Router();

const {
  generateTimetableController,
  getTimetableByDivision,
  getAllTimetables,
  deleteTimetableByDivision,
} = require("../controllers/timetableController");

// POST /api/timetable/generate   { semester: 7 }
router.post("/generate", generateTimetableController);

// GET /api/timetable             -> all divisions, grouped
router.get("/", getAllTimetables);

// GET /api/timetable/:division   -> single division, sorted by day/time
router.get("/:division", getTimetableByDivision);

// DELETE /api/timetable/:division
router.delete("/:division", deleteTimetableByDivision);

module.exports = router;