const express = require("express");

const {
    saveCandidate,
    getSavedCandidates,
    removeSavedCandidate
} = require("../controllers/savedCandidateController");

const router = express.Router();

router.get("/", getSavedCandidates);

router.post("/:studentId", saveCandidate);

router.delete("/:studentId", removeSavedCandidate);

module.exports = router;