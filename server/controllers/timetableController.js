/**
 * timetableController.js
 * ----------------------------------------------------------------------
 * HTTP layer for timetable generation and retrieval.
 * ----------------------------------------------------------------------
 */

const Timetable = require("../models/Timetable");
const Division = require("../models/Division");
const { generateTimetable } = require("../services/timetableGenerator");

/**
 * POST /api/timetable/generate
 * Body: { semester: 7 }
 *
 * Runs the scheduling engine, clears any existing timetable rows for the
 * divisions in that semester, and persists the freshly generated rows.
 */
async function generateTimetableController(req, res) {
  try {
    const semester = Number(req.body.semester);
    if (!semester) {
      return res.status(400).json({ success: false, message: "semester is required in the request body." });
    }

    const { timetable, unplaced, warnings } = await generateTimetable(semester);

    if (!timetable.length) {
      return res.status(422).json({
        success: false,
        message: "No sessions could be scheduled. Check warnings for details.",
        warnings,
        unplaced,
      });
    }

    const divisions = await Division.find({ semester });
    const divisionNames = divisions.map((d) => d.divisionName);

    // Replace old timetable rows for these divisions only.
    await Timetable.deleteMany({ division: { $in: divisionNames } });
    const saved = await Timetable.insertMany(timetable);

    return res.status(201).json({
      success: true,
      message: `Timetable generated for semester ${semester}.`,
      totalSessionsScheduled: saved.length,
      unplacedCount: unplaced.length,
      unplaced,
      warnings,
    });
  } catch (err) {
    console.error("generateTimetableController error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to generate timetable." });
  }
}

/**
 * GET /api/timetable/:division
 * Returns the saved timetable for one division, sorted by day and time.
 */
async function getTimetableByDivision(req, res) {
  try {
    const { division } = req.params;
    const rows = await Timetable.find({ division });

    if (!rows.length) {
      return res.status(404).json({ success: false, message: `No timetable found for division ${division}.` });
    }

    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    rows.sort((a, b) => {
      const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    });

    return res.status(200).json({ success: true, division, count: rows.length, timetable: rows });
  } catch (err) {
    console.error("getTimetableByDivision error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch timetable." });
  }
}

/**
 * GET /api/timetable
 * Returns every saved timetable row, grouped by division.
 */
async function getAllTimetables(req, res) {
  try {
    const rows = await Timetable.find({});
    const grouped = rows.reduce((acc, row) => {
      if (!acc[row.division]) acc[row.division] = [];
      acc[row.division].push(row);
      return acc;
    }, {});
    return res.status(200).json({ success: true, divisions: Object.keys(grouped), timetable: grouped });
  } catch (err) {
    console.error("getAllTimetables error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch timetables." });
  }
}

/**
 * DELETE /api/timetable/:division
 * Clears a single division's saved timetable (useful before re-generating one division).
 */
async function deleteTimetableByDivision(req, res) {
  try {
    const { division } = req.params;
    const result = await Timetable.deleteMany({ division });
    return res.status(200).json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    console.error("deleteTimetableByDivision error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to delete timetable." });
  }
}

module.exports = {
  generateTimetableController,
  getTimetableByDivision,
  getAllTimetables,
  deleteTimetableByDivision,
};