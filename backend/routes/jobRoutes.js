const express = require("express");

const {
    createJob,
    getMyJobs,
    getPublishedJobs,
    getJobById,
    updateJob,
    deleteJob
} = require("../controllers/jobController");

const router = express.Router();

router.post("/", createJob);

router.get("/my", getMyJobs);

router.get("/published", getPublishedJobs);

router.get("/:id", getJobById);

router.put("/:id", updateJob);

router.delete("/:id", deleteJob);

module.exports = router;