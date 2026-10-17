const express = require("express");

const {
    createProject,
    getMyProjects,
    getProjectById,
    updateProject,
    deleteProject
} = require("../controllers/projectController");

const router = express.Router();


// CREATE
router.post("/", createProject);


// READ ALL MY PROJECTS
router.get("/", getMyProjects);


// READ ONE PROJECT
router.get("/:projectId", getProjectById);


// UPDATE
router.put("/:projectId", updateProject);


// DELETE
router.delete("/:projectId", deleteProject);


module.exports = router;