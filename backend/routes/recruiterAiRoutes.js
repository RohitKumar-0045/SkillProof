const express = require("express");

const {
    evaluateJobCandidate
} = require("../controllers/recruiterAiController");

const router = express.Router();

// Evaluate an applicant for a recruiter's job
router.post(
    "/:jobId/:applicationId/evaluate",
    evaluateJobCandidate
);

module.exports = router;