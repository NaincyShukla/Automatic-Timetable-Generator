const Subject = require("../models/Subject");

// Get all subjects
const getSubjects = async (req, res) => {

    try {

        const subjects = await Subject.find();

        res.json(subjects);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

// Add Subject
const addSubject = async (req, res) => {

    try {

        const subject = new Subject(req.body);

        const savedSubject = await subject.save();

        res.status(201).json(savedSubject);

    } catch (err) {

        res.status(400).json({
            message: err.message
        });

    }

};

// Delete Subject
const deleteSubject = async (req, res) => {

    try {

        await Subject.findByIdAndDelete(req.params.id);

        res.json({
            message: "Subject deleted successfully"
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

// Update Subject
const updateSubject = async (req, res) => {

    try {

        const updatedSubject = await Subject.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedSubject) {
            return res.status(404).json({
                message: "Subject not found"
            });
        }

        res.json(updatedSubject);

    } catch (err) {

        res.status(400).json({
            message: err.message
        });

    }

};

module.exports = {
    getSubjects,
    addSubject,
    deleteSubject,
    updateSubject
};
