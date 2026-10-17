const express = require("express");

const {
    createSubmission,
    getMySubmissions,
    getAssignmentSubmissions,
    getSubmissionById,
    evaluateSubmission
} = require("../controllers/submissionController");

const assignmentUpload =
    require("../middleware/assignmentUpload");

const router = express.Router();

router.post(
    "/",
    assignmentUpload.single("file"),
    createSubmission
);

router.get(
    "/my",
    getMySubmissions
);

router.get(
    "/assignment/:assignmentId",
    getAssignmentSubmissions
);

router.post(
    "/:id/evaluate",
    evaluateSubmission
);

router.get(
    "/:id",
    getSubmissionById
);

module.exports = router;