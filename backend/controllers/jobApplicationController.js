const { getAuth } = require("@clerk/express");
const User = require("../models/User");
const Job = require("../models/Job");
const JobApplication = require("../models/JobApplication");
const { sendShortlistEmail } = require("../utils/emailService");

// Get the authenticated student
const getStudent = async (req) => {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated || !userId) {
        return {
            error: {
                status: 401,
                message: "Unauthorized"
            }
        };
    }

    const student = await User.findOne({
        clerkId: userId
    });

    if (!student) {
        return {
            error: {
                status: 404,
                message: "User not found"
            }
        };
    }

    if (student.role !== "student") {
        return {
            error: {
                status: 403,
                message: "Only students can apply for jobs"
            }
        };
    }

    return { student };
};

// Normalize skills stored as strings or objects
const normalizeSkill = (skill) => {
    if (typeof skill === "string") {
        return skill.trim().toLowerCase();
    }

    if (skill && typeof skill === "object") {
        const name = skill.name || skill.skill || skill.value;

        if (typeof name === "string") {
            return name.trim().toLowerCase();
        }
    }

    return "";
};

// Apply for a job
const applyForJob = async (req, res) => {
    try {
        const result = await getStudent(req);

        if (result.error) {
            return res
                .status(result.error.status)
                .json({
                    message: result.error.message
                });
        }

        const { student } = result;

        const job = await Job.findById(req.params.jobId);

        if (!job) {
            return res.status(404).json({
                message: "Job not found"
            });
        }

        if (job.status !== "published") {
            return res.status(400).json({
                message: "This job is not accepting applications"
            });
        }

        if (new Date(job.deadline) < new Date()) {
            return res.status(400).json({
                message: "The application deadline has passed"
            });
        }

        // Normalize student skills
        const studentSkills = (
            Array.isArray(student.skills) ? student.skills : []
        )
            .map(normalizeSkill)
            .filter(Boolean);

        // Normalize recruiter-required skills
        const requiredSkills = (
            Array.isArray(job.skills) ? job.skills : []
        )
            .map(normalizeSkill)
            .filter(Boolean);

        // Validate skill matching when requirements exist
        if (requiredSkills.length > 0) {
            const matchingSkills = requiredSkills.filter(skill =>
                studentSkills.includes(skill)
            );

            // Reject if the student has no matching skills
            if (matchingSkills.length === 0) {
                return res.status(400).json({
                    message:
                        "You cannot apply for this job because your skills do not match the job requirements.",
                    requiredSkills: job.skills,
                    studentSkills: student.skills || [],
                    matchingSkills
                });
            }
        }

        // Prevent duplicate applications
        const existingApplication =
            await JobApplication.findOne({
                job: job._id,
                student: student._id
            });

        if (existingApplication) {
            return res.status(409).json({
                message: "You have already applied for this job"
            });
        }

        // Create the application
        const application = await JobApplication.create({
            job: job._id,
            student: student._id,
            resume: {
                url: student.resume?.url || "",
                publicId: student.resume?.publicId || "",
                resourceType: student.resume?.resourceType || "raw",
                fileName: student.resume?.fileName || ""
            },
            coverLetter: req.body.coverLetter || "",
            status: "applied"
        });

        return res.status(201).json({
            message: "Application submitted successfully",
            application
        });

    } catch (error) {
        console.error(
            "Apply for job error:",
            error.message
        );

        if (error.code === 11000) {
            return res.status(409).json({
                message: "You have already applied for this job"
            });
        }

        return res.status(500).json({
            message: "Failed to submit application"
        });
    }
};

// Withdraw an application
const withdrawApplication = async (req, res) => {
    try {
        const result = await getStudent(req);

        if (result.error) {
            return res
                .status(result.error.status)
                .json({
                    message: result.error.message
                });
        }

        const { student } = result;

        const application = await JobApplication.findOne({
            job: req.params.jobId,
            student: student._id
        });

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        if (application.status === "withdrawn") {
            return res.status(400).json({
                message: "Application is already withdrawn"
            });
        }

        if (
            application.status === "selected" ||
            application.status === "rejected"
        ) {
            return res.status(400).json({
                message: "This application can no longer be withdrawn"
            });
        }

        application.status = "withdrawn";

        await application.save();

        return res.status(200).json({
            message: "Application withdrawn successfully",
            application
        });

    } catch (error) {
        console.error(
            "Withdraw application error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to withdraw application"
        });
    }
};

// Get applications belonging to the logged-in student
const getMyApplications = async (req, res) => {
    try {
        const result = await getStudent(req);

        if (result.error) {
            return res
                .status(result.error.status)
                .json({
                    message: result.error.message
                });
        }

        const { student } = result;

        const applications = await JobApplication.find({
            student: student._id
        })
            .populate(
                "job",
                "title description skills location employmentType deadline status"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            applications
        });

    } catch (error) {
        console.error(
            "Get my applications error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch applications"
        });
    }
};

// Get applicants for a recruiter's job
const getJobApplicants = async (req, res) => {
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
                message: "Only recruiters can view applicants"
            });
        }

        const job = await Job.findOne({
            _id: req.params.jobId,
            recruiter: recruiter._id
        });

        if (!job) {
            return res.status(404).json({
                message: "Job not found or you do not own this job"
            });
        }

        const applications = await JobApplication.find({
            job: job._id,
            status: { $ne: "withdrawn" }
        })
            .populate(
                "student",
                "firstName lastName email skills resume bio college degree branch graduationYear location linkedinUrl githubUrl portfolioUrl"
            )
            .sort({
                createdAt: -1
            });

        return res.status(200).json({
            applications
        });

    } catch (error) {
        console.error(
            "Get job applicants error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch applicants"
        });
    }
};

// Update an application's status
const updateApplicationStatus = async (req, res) => {
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
                message: "Only recruiters can update applications"
            });
        }

        const { status } = req.body;

        const allowedStatuses = [
            "shortlisted",
            "rejected",
            "selected"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid application status"
            });
        }

        const job = await Job.findOne({
            _id: req.params.jobId,
            recruiter: recruiter._id
        });

        if (!job) {
            return res.status(404).json({
                message: "Job not found or you do not own this job"
            });
        }

        const application = await JobApplication.findOne({
            _id: req.params.applicationId,
            job: job._id
        });

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        if (application.status === "withdrawn") {
            return res.status(400).json({
                message: "Withdrawn applications cannot be updated"
            });
        }

        const previousStatus = application.status;

        application.status = status;

        await application.save();

        // Send email when a student is shortlisted
        if (
            status === "shortlisted" &&
            previousStatus !== "shortlisted"
        ) {
            try {
                const student = await User.findById(
                    application.student
                );

                if (student?.email) {
                    await sendShortlistEmail({
                        studentName:
                            `${student.firstName} ${student.lastName}`.trim(),
                        studentEmail: student.email,
                        jobTitle: job.title
                    });

                    console.log(
                        `Shortlist email sent to ${student.email}`
                    );
                } else {
                    console.error("Student email not found.");
                }

            } catch (emailError) {
                console.error(
                    "Failed to send shortlist email:",
                    emailError.message
                );
            }
        }

        return res.status(200).json({
            message: "Application status updated successfully",
            application
        });

    } catch (error) {
        console.error(
            "Update application status error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to update application status"
        });
    }
};

// Export controller functions
module.exports = {
    applyForJob,
    withdrawApplication,
    getMyApplications,
    getJobApplicants,
    updateApplicationStatus
};