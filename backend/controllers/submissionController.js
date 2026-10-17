const { getAuth } = require("@clerk/express");
const cloudinary = require("../config/cloudinary");
const AdmZip = require("adm-zip");

const Submission = require("../models/Submission");
const Assignment = require("../models/Assignments");
const User = require("../models/User");
const Evidence = require("../models/Evidence");

const {
    evaluateAssignment
} = require("../services/assignmentAiService");


const getBestAttempt = (submissions) => {
    const evaluated = submissions.filter(
        (submission) =>
            submission.status === "evaluated" &&
            typeof submission.aiEvaluation?.score === "number"
    );

    if (evaluated.length === 0) {
        return null;
    }

    return evaluated.reduce((best, current) => {
        if (!best) {
            return current;
        }

        return current.aiEvaluation.score >
            best.aiEvaluation.score
            ? current
            : best;
    }, null);
};


const createSubmission = async (req, res) => {
    try {
        const {
            isAuthenticated,
            userId: clerkId
        } = getAuth(req);

        if (!isAuthenticated || !clerkId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const user = await User.findOne({
            clerkId
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.role !== "student") {
            return res.status(403).json({
                message:
                    "Only students can submit assignments"
            });
        }

        const { assignmentId } = req.body;

        if (!assignmentId) {
            return res.status(400).json({
                message: "Assignment is required"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "Assignment file is required"
            });
        }

        const assignment =
            await Assignment.findById(assignmentId);

        if (!assignment) {
            return res.status(404).json({
                message: "Assignment not found"
            });
        }

        if (assignment.status !== "published") {
            return res.status(400).json({
                message:
                    "This assignment is not available"
            });
        }

        if (
            new Date(assignment.deadline) <
            new Date()
        ) {
            return res.status(400).json({
                message:
                    "Assignment deadline has passed"
            });
        }

        const existingSubmissions =
            await Submission.find({
                assignment: assignmentId,
                student: user._id
            }).sort({
                attemptNumber: 1,
                createdAt: 1
            });

        if (existingSubmissions.length >= 3) {
            return res.status(400).json({
                message:
                    "You have used all 3 attempts for this assignment"
            });
        }

        const attemptNumber =
            existingSubmissions.length + 1;

        const uploadResult =
            await new Promise(
                (resolve, reject) => {
                    const uploadStream =
                        cloudinary.uploader.upload_stream(
                            {
                                resource_type: "raw",
                                folder:
                                    "skillproof/assignments",
                                public_id:
                                    `${user.clerkId}-${assignmentId}-${Date.now()}`
                            },
                            (error, result) => {
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve(result);
                                }
                            }
                        );

                    uploadStream.end(
                        req.file.buffer
                    );
                }
            );

        const submission =
            await Submission.create({
                assignment: assignmentId,
                student: user._id,
                attemptNumber,
                file: {
                    url:
                        uploadResult.secure_url,
                    publicId:
                        uploadResult.public_id,
                    fileName:
                        req.file.originalname,
                    fileType:
                        req.file.mimetype,
                    fileSize:
                        req.file.size
                }
            });

        return res.status(201).json({
            message:
                `Assignment ${attemptNumber} submitted successfully`,
            submission
        });

    } catch (error) {
        console.error(
            "Create submission error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to submit assignment"
        });
    }
};


const getMySubmissions = async (
    req,
    res
) => {
    try {
        const {
            isAuthenticated,
            userId: clerkId
        } = getAuth(req);

        if (!isAuthenticated || !clerkId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const user =
            await User.findOne({
                clerkId
            });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.role !== "student") {
            return res.status(403).json({
                message:
                    "Only students can access submissions"
            });
        }

        const submissions =
            await Submission.find({
                student: user._id
            })
                .populate("assignment")
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            submissions
        });

    } catch (error) {
        console.error(
            "Get submissions error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch submissions"
        });
    }
};


const getAssignmentSubmissions = async (
    req,
    res
) => {
    try {
        const {
            isAuthenticated,
            userId: clerkId
        } = getAuth(req);

        if (!isAuthenticated || !clerkId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const user =
            await User.findOne({
                clerkId
            });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.role !== "recruiter") {
            return res.status(403).json({
                message:
                    "Only recruiters can access assignment submissions"
            });
        }

        const assignment =
            await Assignment.findOne({
                _id: req.params.assignmentId,
                createdBy: user._id
            });

        if (!assignment) {
            return res.status(404).json({
                message:
                    "Assignment not found"
            });
        }

        const submissions =
            await Submission.find({
                assignment: assignment._id
            })
                .populate(
                    "student",
                    "firstName lastName email"
                )
                .sort({
                    attemptNumber: 1,
                    createdAt: 1
                });

        return res.status(200).json({
            submissions
        });

    } catch (error) {
        console.error(
            "Get assignment submissions error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch assignment submissions"
        });
    }
};


const getSubmissionById = async (
    req,
    res
) => {
    try {
        const {
            isAuthenticated,
            userId: clerkId
        } = getAuth(req);

        if (!isAuthenticated || !clerkId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const user =
            await User.findOne({
                clerkId
            });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const submission =
            await Submission.findById(
                req.params.id
            )
                .populate("assignment")
                .populate(
                    "student",
                    "firstName lastName email"
                );

        if (!submission) {
            return res.status(404).json({
                message:
                    "Submission not found"
            });
        }

        if (
            user.role === "student" &&
            submission.student._id.toString() !==
            user._id.toString()
        ) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        if (user.role === "recruiter") {
            const assignment =
                await Assignment.findOne({
                    _id:
                        submission.assignment._id,
                    createdBy:
                        user._id
                });

            if (!assignment) {
                return res.status(403).json({
                    message: "Access denied"
                });
            }
        }

        return res.status(200).json({
            submission
        });

    } catch (error) {
        console.error(
            "Get submission error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch submission"
        });
    }
};


const downloadSubmissionFile = async (
    url
) => {
    const response =
        await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Failed to download submission file: ${response.status}`
        );
    }

    const arrayBuffer =
        await response.arrayBuffer();

    return Buffer.from(
        arrayBuffer
    );
};


const extractSourceFiles = (
    buffer,
    fileName
) => {
    const lowerFileName =
        fileName.toLowerCase();

    const sourceFiles = [];

    const allowedExtensions = [
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".py",
        ".java",
        ".c",
        ".cpp",
        ".h",
        ".html",
        ".css",
        ".json",
        ".txt"
    ];

    if (
        lowerFileName.endsWith(".zip")
    ) {
        const zip =
            new AdmZip(buffer);

        const entries =
            zip.getEntries();

        for (const entry of entries) {
            if (entry.isDirectory) {
                continue;
            }

            const entryName =
                entry.entryName;

            const lowerEntryName =
                entryName.toLowerCase();

            const ignoredPaths = [
                "node_modules/",
                "dist/",
                "build/",
                ".git/",
                "coverage/",
                ".next/",
                "vendor/"
            ];

            const shouldIgnore =
                ignoredPaths.some(
                    (path) =>
                        lowerEntryName.includes(path)
                );

            if (shouldIgnore) {
                continue;
            }

            const isAllowed =
                allowedExtensions.some(
                    (extension) =>
                        lowerEntryName.endsWith(
                            extension
                        )
                );

            if (!isAllowed) {
                continue;
            }

            let content;

            try {
                content =
                    entry
                        .getData()
                        .toString("utf8");
            } catch {
                continue;
            }

            if (!content.trim()) {
                continue;
            }

            sourceFiles.push({
                path: entryName,
                content:
                    content.slice(0, 5000)
            });

            if (
                sourceFiles.length >= 8
            ) {
                break;
            }
        }

        return sourceFiles;
    }

    const isAllowed =
        allowedExtensions.some(
            (extension) =>
                lowerFileName.endsWith(
                    extension
                )
        );

    if (!isAllowed) {
        throw new Error(
            "Unsupported file type for AI evaluation"
        );
    }

    const content =
        buffer.toString("utf8");

    sourceFiles.push({
        path: fileName,
        content:
            content.slice(0, 10000)
    });

    return sourceFiles;
};


const evaluateSubmission = async (
    req,
    res
) => {
    let submission = null;

    try {
        const {
            isAuthenticated,
            userId: clerkId
        } = getAuth(req);

        if (!isAuthenticated || !clerkId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const user =
            await User.findOne({
                clerkId
            });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.role !== "student") {
            return res.status(403).json({
                message:
                    "Only students can evaluate submissions"
            });
        }

        submission =
            await Submission.findById(
                req.params.id
            ).populate("assignment");

        if (!submission) {
            return res.status(404).json({
                message:
                    "Submission not found"
            });
        }

        if (
            submission.student.toString() !==
            user._id.toString()
        ) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        if (
            submission.status ===
            "analyzing"
        ) {
            return res.status(400).json({
                message:
                    "Submission is already being analyzed"
            });
        }

        submission.status =
            "analyzing";

        await submission.save();

        try {
            const fileBuffer =
                await downloadSubmissionFile(
                    submission.file.url
                );

            const sourceFiles =
                extractSourceFiles(
                    fileBuffer,
                    submission.file.fileName
                );

            if (!sourceFiles.length) {
                throw new Error(
                    "No readable source code found in submission"
                );
            }

            const assignment =
                submission.assignment;

            const evaluation =
                await evaluateAssignment({
                    assignmentTitle:
                        assignment.title,

                    assignmentDescription:
                        assignment.description,

                    skills:
                        assignment.skills,

                    difficulty:
                        assignment.difficulty,

                    fileName:
                        submission.file.fileName,

                    sourceFiles
                });

            submission.aiEvaluation = {
                score:
                    evaluation.score,

                summary:
                    evaluation.summary,

                strengths:
                    evaluation.strengths,

                weaknesses:
                    evaluation.weaknesses,

                suggestions:
                    evaluation.suggestions,

                evaluatedAt:
                    new Date()
            };

            submission.status =
                "evaluated";

            await submission.save();

            const allAttempts =
                await Submission.find({
                    assignment:
                        assignment._id,
                    student:
                        user._id
                }).sort({
                    attemptNumber: 1,
                    createdAt: 1
                });

            const bestAttempt =
                getBestAttempt(
                    allAttempts
                );

            if (bestAttempt) {
                const assignmentSkills =
                    assignment.skills || [];

                for (
                    const skill
                    of assignmentSkills
                ) {
                    const skillName =
                        skill.trim();

                    if (!skillName) {
                        continue;
                    }

                    const skillExists =
                        user.skills?.some(
                            (userSkill) =>
                                userSkill.name
                                    ?.toLowerCase() ===
                                skillName.toLowerCase()
                        );

                    if (!skillExists) {
                        continue;
                    }

                    let evidence =
                        await Evidence.findOne({
                            user: user._id,
                            assignment:
                                assignment._id,
                            skillName,
                            type: "assignment"
                        });

                    if (!evidence) {
                        evidence =
                            await Evidence.findOne({
                                user: user._id,
                                skillName,
                                type: "assignment",
                                "source.url":
                                    bestAttempt.file.url
                            });
                    }

                    const bestEvaluation =
                        bestAttempt.aiEvaluation;

                    if (evidence) {
                        evidence.assignment =
                            assignment._id;

                        evidence.source = {
                            url:
                                bestAttempt.file.url
                        };

                        evidence.status =
                            "analyzed";

                        evidence.aiAnalysis = {
                            score:
                                bestEvaluation.score,

                            summary:
                                bestEvaluation.summary,

                            strengths:
                                bestEvaluation.strengths,

                            weaknesses:
                                bestEvaluation.weaknesses,

                            technologiesDetected:
                                [],

                            analyzedAt:
                                bestEvaluation.evaluatedAt ||
                                new Date()
                        };

                        await evidence.save();
                    } else {
                        await Evidence.create({
                            user: user._id,

                            assignment:
                                assignment._id,

                            skillName,

                            project: null,

                            type: "assignment",

                            source: {
                                url:
                                    bestAttempt.file.url
                            },

                            status:
                                "analyzed",

                            aiAnalysis: {
                                score:
                                    bestEvaluation.score,

                                summary:
                                    bestEvaluation.summary,

                                strengths:
                                    bestEvaluation.strengths,

                                weaknesses:
                                    bestEvaluation.weaknesses,

                                technologiesDetected:
                                    [],

                                analyzedAt:
                                    bestEvaluation.evaluatedAt ||
                                    new Date()
                            }
                        });
                    }
                }
            }

            return res.status(200).json({
                message:
                    "Assignment evaluated successfully",

                submission,

                attemptsUsed:
                    allAttempts.length,

                bestScore:
                    bestAttempt
                        ? bestAttempt.aiEvaluation.score
                        : null,

                bestSubmissionId:
                    bestAttempt
                        ? bestAttempt._id
                        : null
            });

        } catch (evaluationError) {
            submission.status =
                "submitted";

            await submission.save();

            throw evaluationError;
        }

    } catch (error) {
        console.error(
            "Evaluate submission error:",
            error
        );

        if (
            submission &&
            submission.status ===
            "analyzing"
        ) {
            submission.status =
                "submitted";

            await submission.save();
        }

        return res.status(500).json({
            message:
                error.message ||
                "Failed to evaluate submission"
        });
    }
};


module.exports = {
    createSubmission,
    getMySubmissions,
    getAssignmentSubmissions,
    getSubmissionById,
    evaluateSubmission
};