const Teacher = require("../models/Teacher");

// Get All Teachers
const getTeachers = async (req, res) => {

  try {

    const teachers = await Teacher.find();

    res.json(teachers);

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }

};

// Add Teacher
const addTeacher = async (req, res) => {
  try {
    console.log("Incoming Body:", req.body);

    const teacher = new Teacher(req.body);

    await teacher.save();

    console.log("Teacher Saved");

    res.status(201).json(teacher);

  } catch (err) {

    console.error("FULL ERROR:");
    console.error(err);

    res.status(500).json({
      message: err.message,
      stack: err.stack
    });

  }
};

// Delete Teacher
const deleteTeacher = async (req, res) => {

  try {

    const teacher = await Teacher.findByIdAndDelete(req.params.id);

    if (!teacher) {

      return res.status(404).json({
        message: "Teacher not found",
      });

    }

    res.json({
      message: "Teacher deleted successfully",
    });

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }

};

module.exports = {
  getTeachers,
  addTeacher,
  deleteTeacher,
};