const User = require("../models/User");
const { getAuth } = require("@clerk/express");
const cloudinary = require("../config/cloudinary");
const axios = require("axios");
const { extractPdfText } = require("../services/pdfService");
const { analyzeResume } = require("../services/resumeAiService");
const createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, role } = req.body;

        const { isAuthenticated, userId } = getAuth(req);

        if (!isAuthenticated || !userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const existingUser = await User.findOne({
            clerkId: userId
        });

        if (existingUser) {
            return res.status(200).json({
                message: "User already exists",
                user: existingUser
            });
        }

        const user = await User.create({
            clerkId: userId,
            firstName,
            lastName,
            email,
            role
        });

        return res.status(201).json({
            message: "User created successfully",
            user
        });

    } catch (error) {
        console.error(
            "Create User error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


const getCurrentUser = async (req, res) => {
    try {
        const { isAuthenticated, userId } = getAuth(req);

        if (!isAuthenticated || !userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const user = await User.findOne({
            clerkId: userId
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            user
        });

    } catch (error) {
        console.error(
            "Get current user error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


const updateProfile = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            bio,
            college,
            degree,
            branch,
            graduationYear,
            location,
            linkedinUrl,
            githubUrl,
            portfolioUrl,
            designation,
            companyName,
            companyWebsite,
            companyIndustry,
            companySize,
            companyDescription,
            phone
        } = req.body;

        const { isAuthenticated, userId } = getAuth(req);

        if (!isAuthenticated || !userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const user = await User.findOne({
            clerkId: userId
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;

        user.bio = bio;
        user.college = college;
        user.degree = degree;
        user.branch = branch;
        user.graduationYear = graduationYear;
        user.location = location;

        user.linkedinUrl = linkedinUrl;
        user.githubUrl = githubUrl;
        user.portfolioUrl = portfolioUrl;

        // Recruiter and company details
        user.designation = designation;
        user.companyName = companyName;
        user.companyWebsite = companyWebsite;
        user.companyIndustry = companyIndustry;
        user.companySize = companySize;
        user.companyDescription = companyDescription;
        user.phone = phone;

        await user.save();

        return res.status(200).json({
            message: "Profile updated successfully",
            user
        });

    } catch (error) {
        console.error(
            "Update profile error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};

const addSkill = async (req, res) => {
    try {
        const { name, category, level } = req.body;

        const { isAuthenticated, userId } = getAuth(req);

        console.log("Authenticated:", isAuthenticated);
        console.log("Clerk User ID from request:", userId);

        if (!isAuthenticated || !userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Skill name is required"
            });
        }

        const user = await User.findOne({
            clerkId: userId
        });

        console.log(
            "MongoDB user found:",
            user ? user.clerkId : "NOT FOUND"
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const normalizedName = name.trim().toLowerCase();

        const duplicateSkill = user.skills.some(
            (skill) =>
                skill.name.trim().toLowerCase() === normalizedName
        );

        if (duplicateSkill) {
            return res.status(400).json({
                message: "This skill already exists"
            });
        }

        user.skills.push({
            name: name.trim(),
            category,
            level
        });

        await user.save();

        return res.status(201).json({
            message: "Skill added successfully",
            skills: user.skills
        });

    } catch (error) {
        console.error(
            "Add Skill error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


const updateSkill = async (req, res) => {
    try {
        const { skillId } = req.params;
        const { name, category, level } = req.body;

        const { isAuthenticated, userId } = getAuth(req);

        console.log("Update Skill - Authenticated:", isAuthenticated);
        console.log("Update Skill - Clerk User ID:", userId);

        if (!isAuthenticated || !userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Skill name is required"
            });
        }

        const user = await User.findOne({
            clerkId: userId
        });

        console.log(
            "Update Skill - MongoDB user:",
            user ? user.clerkId : "NOT FOUND"
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const normalizedSkillName =
            name.trim().toLowerCase();

        const skillExists = user.skills.some(
            (skill) =>
                skill._id.toString() !== skillId &&
                skill.name.trim().toLowerCase() ===
                normalizedSkillName
        );

        if (skillExists) {
            return res.status(400).json({
                message:
                    "A skill with this name already exists"
            });
        }

        const skill = user.skills.id(skillId);

        if (!skill) {
            return res.status(404).json({
                message: "Skill not found"
            });
        }

        skill.name = name.trim();
        skill.category = category;
        skill.level = level;

        await user.save();

        return res.status(200).json({
            message: "Skill updated successfully",
            skills: user.skills
        });
    } catch (error) {
        console.error(
            "Update skill error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to update skill"
        });
    }
};

const removeSkill = async (req, res) => {
    try {
        const { skillId } = req.params;

        const { isAuthenticated, userId } = getAuth(req);

        console.log("Remove Skill - Authenticated:", isAuthenticated);
        console.log("Remove Skill - Clerk User ID:", userId);

        if (!isAuthenticated || !userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const user = await User.findOne({
            clerkId: userId
        });

        console.log(
            "Remove Skill - MongoDB user:",
            user ? user.clerkId : "NOT FOUND"
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const skill = user.skills.id(skillId);

        if (!skill) {
            return res.status(404).json({
                message: "Skill not found"
            });
        }

        skill.deleteOne();

        await user.save();

        return res.status(200).json({
            message: "Skill removed successfully",
            skills: user.skills
        });
    } catch (error) {
        console.error(
            "Remove skill error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to remove skill"
        });
    }
};

const uploadResume = async (req, res) => {
    try {
        const { isAuthenticated, userId } = getAuth(req);

        if (!isAuthenticated || !userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "Resume PDF is required"
            });
        }

        if (req.file.mimetype !== "application/pdf") {
            return res.status(400).json({
                message: "Only PDF files are allowed"
            });
        }

        const user = await User.findOne({
            clerkId: userId
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Upload the new PDF to Cloudinary first.
        const uploadResult = await new Promise(
            (resolve, reject) => {
                const uploadStream =
                    cloudinary.uploader.upload_stream(
                        {
                            resource_type: "image",
                            type: "upload",
                            folder: "skillproof/resumes",
                            public_id: `${user.clerkId}-${Date.now()}.pdf`
                        },
                        (error, result) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve(result);
                            }
                        }
                    );

                uploadStream.end(req.file.buffer);
            }
        );

        // Preserve the previous resume information until
        // the new resume has been uploaded successfully.
        const previousResume = user.resume
            ? user.resume.toObject
                ? user.resume.toObject()
                : { ...user.resume }
            : null;

        // Save the new resume details.
        user.resume = {
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            resourceType: uploadResult.resource_type,
            fileName: req.file.originalname,
            uploadedAt: new Date()
        };

        // Clear the previous analysis because this is a new resume.
        user.resumeAnalysis = {
            overallScore: null,
            categoryScores: {
                skills: null,
                projects: null,
                education: null,
                experience: null,
                formatting: null
            },
            strengths: [],
            weaknesses: [],
            suggestions: [],
            analyzedAt: null
        };

        // Save the new resume before running AI analysis.
        await user.save();

        // Extract text from the uploaded PDF buffer.
        let resumeText;

        try {
            resumeText = await extractPdfText(req.file.buffer);
        } catch (error) {
            console.error(
                "Resume text extraction failed:",
                error.message
            );

            return res.status(200).json({
                message: "Resume uploaded, but its text could not be extracted.",
                resume: user.resume,
                analysisStatus: "failed",
                analysisMessage:
                    "Please upload a text-based PDF with readable content."
            });
        }

        // Analyze the extracted text using the existing Groq API.
        let analysis;

        try {
            analysis = await analyzeResume({
                resumeText
            });
        } catch (error) {
            console.error(
                "Resume AI analysis failed:",
                error.message
            );

            return res.status(200).json({
                message: "Resume uploaded, but AI analysis failed.",
                resume: user.resume,
                analysisStatus: "failed",
                analysisMessage:
                    "Your resume is saved. Please try analyzing it again later."
            });
        }

        // Store the new analysis in this user's document.
        user.resumeAnalysis = {
            overallScore: analysis.overallScore,
            categoryScores: analysis.categoryScores,
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses,
            suggestions: analysis.suggestions,
            analyzedAt: new Date()
        };

        await user.save();

        // Delete the old Cloudinary resume only after
        // the new resume and its analysis have been saved.
        if (
            previousResume?.publicId &&
            previousResume.publicId !== uploadResult.public_id
        ) {
            try {
                await cloudinary.uploader.destroy(
                    previousResume.publicId,
                    {
                        resource_type:
                            previousResume.resourceType || "raw",
                        type: "upload"
                    }
                );
            } catch (deleteError) {
                console.error(
                    "Old resume deletion error:",
                    deleteError.message
                );
            }
        }

        return res.status(200).json({
            message: "Resume uploaded and analyzed successfully",
            resume: user.resume,
            analysisStatus: "completed",
            analysis: user.resumeAnalysis
        });

    } catch (error) {
        console.error(
            "Resume upload error:",
            error
        );

        return res.status(500).json({
            message: "Failed to upload resume"
        });
    }
};


const previewResume = async (req, res) => {
    try {
        const { isAuthenticated, userId } = getAuth(req);
        if (!isAuthenticated || !userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await User.findOne({ clerkId: userId }).select("resume");
        if (!user?.resume?.url) {
            return res.status(404).json({ message: "No resume found" });
        }

        const file = await axios.get(user.resume.url, { responseType: "stream" });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline");
        res.setHeader("Cache-Control", "private, no-store");
        if (file.headers["content-length"]) {
            res.setHeader("Content-Length", file.headers["content-length"]);
        }
        file.data.on("error", (error) => {
            console.error("Resume preview stream error:", error.message);
            if (!res.headersSent) res.status(502);
            res.end();
        });
        file.data.pipe(res);
    } catch (error) {
        const cloudinaryError = error.response?.headers?.["x-cld-error"];
        console.error("Resume preview error:", error.message, cloudinaryError || "");
        if (error.response?.status === 401) {
            return res.status(502).json({
                message: "Cloudinary blocked PDF delivery. Enable 'Allow delivery of PDF and ZIP files' in Cloudinary Console > Settings > Security, then try again."
            });
        }
        return res.status(502).json({ message: "Failed to load resume preview" });
    }
};

const deleteResume = async (req, res) => {
    try {
        const { isAuthenticated, userId } = getAuth(req);

        if (!isAuthenticated || !userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const user = await User.findOne({
            clerkId: userId
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!user.resume?.publicId) {
            return res.status(404).json({
                message: "No resume found"
            });
        }

        await cloudinary.uploader.destroy(
            user.resume.publicId,
            {
                resource_type: user.resume.resourceType || "raw",
                type: "upload"
            }
        );

        user.resume = {
            url: "",
            publicId: "",
            fileName: "",
            uploadedAt: null
        };

        await user.save();

        return res.status(200).json({
            message: "Resume deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete resume error:",
            error
        );

        return res.status(500).json({
            message: "Failed to delete resume"
        });
    }
};
const getAllStudents = async (req, res) => {
    try {

        const { isAuthenticated, userId } = getAuth(req);

        if (!isAuthenticated || !userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const recruiter = await User.findOne({
            clerkId: userId
        });

        if (!recruiter) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (recruiter.role !== "recruiter") {
            return res.status(403).json({
                message: "Only recruiters can view students"
            });
        }

        const students = await User.find({
            role: "student"
        })
            .select(
                "firstName lastName email bio college degree branch graduationYear location linkedinUrl githubUrl portfolioUrl skills projects resume"
            )
            .populate(
                "projects",
                "title description technologies githubUrl githubRepo liveUrl"
            )
            .lean();

        const Evidence = require("../models/Evidence");

        const studentIds = students.map(
            (student) => student._id
        );

        const evidence = await Evidence.find({
            user: { $in: studentIds },
            type: "github"
        })
            .select(
                "user skillName project type source aiAnalysis status"
            )
            .lean();

        const studentsWithProofScore = students.map(
            (student) => {

                const studentEvidence =
                    evidence.filter(
                        (item) =>
                            item.user.toString() ===
                            student._id.toString()
                    );

                const scoredEvidence =
                    studentEvidence.filter(
                        (item) =>
                            typeof item.aiAnalysis?.score ===
                            "number" &&
                            item.aiAnalysis.score > 0
                    );

                let proofScore = 0;

                if (scoredEvidence.length > 0) {

                    const totalScore =
                        scoredEvidence.reduce(
                            (sum, item) =>
                                sum +
                                item.aiAnalysis.score,
                            0
                        );

                    proofScore = Math.round(
                        totalScore /
                        scoredEvidence.length
                    );
                }

                return {
                    ...student,
                    proofScore,
                    evidence: studentEvidence
                };
            }
        );

        return res.status(200).json({
            students: studentsWithProofScore
        });

    } catch (error) {

        console.error(
            "Get all students error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch students"
        });
    }
};
module.exports = {
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
};
