const { getAuth } = require("@clerk/express");
const User = require("../models/User");
const SavedCandidate = require("../models/SavedCandidate");
const Evidence = require("../models/Evidence");

const getRecruiter = async (req) => {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated || !userId) {
        return {
            error: {
                status: 401,
                message: "Unauthorized"
            }
        };
    }

    const recruiter = await User.findOne({
        clerkId: userId
    });

    if (!recruiter) {
        return {
            error: {
                status: 404,
                message: "User not found"
            }
        };
    }

    if (recruiter.role !== "recruiter") {
        return {
            error: {
                status: 403,
                message: "Only recruiters can save candidates"
            }
        };
    }

    return { recruiter };
};


// Save candidate
const saveCandidate = async (req, res) => {
    try {
        const result = await getRecruiter(req);

        if (result.error) {
            return res
                .status(result.error.status)
                .json({
                    message: result.error.message
                });
        }

        const { recruiter } = result;
        const { studentId } = req.params;

        const student = await User.findOne({
            _id: studentId,
            role: "student"
        });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const existing = await SavedCandidate.findOne({
            recruiter: recruiter._id,
            student: student._id
        });

        if (existing) {
            return res.status(409).json({
                message: "Candidate is already saved"
            });
        }

        const savedCandidate = await SavedCandidate.create({
            recruiter: recruiter._id,
            student: student._id
        });

        return res.status(201).json({
            message: "Candidate saved successfully",
            savedCandidate
        });

    } catch (error) {
        console.error(
            "Save candidate error:",
            error.message
        );

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Candidate is already saved"
            });
        }

        return res.status(500).json({
            message: "Failed to save candidate"
        });
    }
};


// Get saved candidates
const getSavedCandidates = async (req, res) => {
    try {
        const result = await getRecruiter(req);

        if (result.error) {
            return res
                .status(result.error.status)
                .json({
                    message: result.error.message
                });
        }

        const { recruiter } = result;

        const savedCandidates = await SavedCandidate.find({
            recruiter: recruiter._id
        })
            .populate(
                "student",
                "firstName lastName email skills projects resume bio college degree branch graduationYear location linkedinUrl githubUrl portfolioUrl"
            )
            .sort({
                createdAt: -1
            })
            .lean();

        const studentIds = savedCandidates
            .map((saved) => saved.student?._id)
            .filter(Boolean);

        const evidence = await Evidence.find({
            user: { $in: studentIds },
            type: "github"
        })
            .select(
                "user skillName project type source aiAnalysis status"
            )
            .lean();

        const savedCandidatesWithProofScore =
            savedCandidates.map((saved) => {

                if (!saved.student) {
                    return saved;
                }

                const studentEvidence = evidence.filter(
                    (item) =>
                        item.user.toString() ===
                        saved.student._id.toString()
                );

                const scoredEvidence =
                    studentEvidence.filter(
                        (item) =>
                            typeof item.aiAnalysis?.score === "number" &&
                            item.aiAnalysis.score > 0
                    );

                let proofScore = 0;

                if (scoredEvidence.length > 0) {
                    const totalScore =
                        scoredEvidence.reduce(
                            (sum, item) =>
                                sum + item.aiAnalysis.score,
                            0
                        );

                    proofScore = Math.round(
                        totalScore /
                        scoredEvidence.length
                    );
                }

                saved.student.proofScore = proofScore;
                saved.student.evidence = studentEvidence;

                return saved;
            });

        return res.status(200).json({
            savedCandidates: savedCandidatesWithProofScore
        });

    } catch (error) {
        console.error(
            "Get saved candidates error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch saved candidates"
        });
    }
};


// Remove saved candidate
const removeSavedCandidate = async (req, res) => {
    try {
        const result = await getRecruiter(req);

        if (result.error) {
            return res
                .status(result.error.status)
                .json({
                    message: result.error.message
                });
        }

        const { recruiter } = result;
        const { studentId } = req.params;

        const deletedCandidate =
            await SavedCandidate.findOneAndDelete({
                recruiter: recruiter._id,
                student: studentId
            });

        if (!deletedCandidate) {
            return res.status(404).json({
                message: "Saved candidate not found"
            });
        }

        return res.status(200).json({
            message: "Candidate removed from saved list"
        });

    } catch (error) {
        console.error(
            "Remove saved candidate error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to remove saved candidate"
        });
    }
};


module.exports = {
    saveCandidate,
    getSavedCandidates,
    removeSavedCandidate
};