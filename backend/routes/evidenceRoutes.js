const express = require("express");

const {
    createEvidence,
    getMyEvidence,
    getEvidenceById,
    analyzeEvidence,
    deleteEvidence
} = require("../controllers/evidenceController");

const router = express.Router();

router.post("/", createEvidence);
router.get("/", getMyEvidence);
router.get("/:evidenceId", getEvidenceById);
router.post("/:evidenceId/analyze", analyzeEvidence);
router.delete("/:evidenceId", deleteEvidence);

module.exports = router;