const express = require("express");

const {
    applyForJob,
    withdrawApplication,
    getMyApplications,
    getJobApplicants,
    updateApplicationStatus
} = require("../controllers/jobApplicationController");

const router = express.Router();

router.get("/my", getMyApplications);

router.get("/:jobId/applicants", getJobApplicants);

router.post("/:jobId/apply", applyForJob);

router.put("/:jobId/withdraw", withdrawApplication);

router.put(
    "/:jobId/:applicationId/status",
    updateApplicationStatus
);

module.exports = router;