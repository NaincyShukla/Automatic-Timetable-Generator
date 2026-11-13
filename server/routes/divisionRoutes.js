const express = require("express");

const router = express.Router();

const {
  getDivisions,
  addDivision,
  deleteDivision,
} = require("../controllers/divisionController");

router.get("/", getDivisions);
router.post("/", addDivision);
router.delete("/:id", deleteDivision);

module.exports = router;