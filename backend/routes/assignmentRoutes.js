const express = require("express");

const {
    createAssignment,
    getMyAssignments,
    getPublishedAssignments,
    getAssignmentById,
    updateAssignment,
    deleteAssignment
} = require("../controllers/assignmentController");

const router = express.Router();

router.post("/", createAssignment);

router.get("/my", getMyAssignments);

router.get("/published", getPublishedAssignments);

router.get("/:id", getAssignmentById);

router.put("/:id", updateAssignment);

router.delete("/:id", deleteAssignment);

module.exports = router;