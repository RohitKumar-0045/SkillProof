const express = require("express");

const {
    createUser,
    getCurrentUser,
    getAllStudents,
    addSkill,
    removeSkill,
    updateSkill,
    updateProfile,
    uploadResume,
    deleteResume,
    previewResume
} = require("../controllers/userController");

const uploadResumeMiddleware = require(
    "../middleware/uploadResume"
);

const router = express.Router();

router.post("/", createUser);

router.get("/me", getCurrentUser);

router.put("/profile", updateProfile);

router.post("/skills", addSkill);

router.get("/students", getAllStudents);

router.put("/skills/:skillId", updateSkill);

router.delete("/skills/:skillId", removeSkill);

router.post(
    "/resume",
    uploadResumeMiddleware.single("resume"),
    uploadResume
);

router.get("/resume/preview", previewResume);

router.delete(
    "/resume",
    deleteResume
);

module.exports = router;
