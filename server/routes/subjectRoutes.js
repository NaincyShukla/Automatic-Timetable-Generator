const express = require("express");

const router = express.Router();

const {
    getSubjects,
    addSubject,
    updateSubject,
    deleteSubject,
} = require("../controllers/subjectController");

// Get all subjects
router.get("/", getSubjects);

// Add subject
router.post("/", addSubject);

// Update subject
router.put("/:id", updateSubject);

// Delete subject
router.delete("/:id", deleteSubject);

module.exports = router;