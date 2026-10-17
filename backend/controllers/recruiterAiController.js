const { getAuth } = require("@clerk/express");

const User = require("../models/User");
const Job = require("../models/Job");
const JobApplication = require("../models/JobApplication");
const Project = require("../models/Project");

const {
    evaluateCandidate
} = require("../services/candidateAiService");

// Evaluate a candidate for a recruiter's job
const evaluateJobCandidate = async (req, res) => {
    try {
        // 1. Authenticate recruiter
        const { isAuthenticated, userId } = getAuth(req);

        if (!isAuthenticated || !userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        // 2. Find recruiter in MongoDB
        const recruiter = await User.findOne({
            clerkId: userId
        });

        if (!recruiter) {
            return res.status(404).json({
                message: "Recruiter account not found"
            });
        }

        if (recruiter.role !== "recruiter") {
            return res.status(403).json({
                message: "Only recruiters can evaluate candidates"
            });
        }

        // 3. Verify job ownership
        const { jobId, applicationId } = req.params;

        const job = await Job.findOne({
            _id: jobId,
            recruiter: recruiter._id
        });

        if (!job) {
            return res.status(404).json({
                message: "Job not found or access denied"
            });
        }

        // 4. Find application belonging to this job
        const application = await JobApplication.findOne({
            _id: applicationId,
            job: job._id,
            status: { $ne: "withdrawn" }
        });

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        // 5. Retrieve candidate
        const candidate = await User.findById(
            application.student
        ).select(
            "firstName lastName skills resumeAnalysis projects"
        );

        if (!candidate) {
            return res.status(404).json({
                message: "Candidate not found"
            });
        }

        // 6. Retrieve candidate projects
        const projects = await Project.find({
            user: candidate._id
        }).select(
            "title description technologies githubUrl liveUrl"
        );

        // 7. Evaluate candidate
        const evaluation = await evaluateCandidate({
            job,
            candidate,
            projects
        });

        // 8. Return evaluation
        return res.status(200).json({
            message: "Candidate evaluated successfully",

            candidate: {
                id: candidate._id,
                firstName: candidate.firstName,
                lastName: candidate.lastName
            },

            job: {
                id: job._id,
                title: job.title
            },

            evaluation
        });

    } catch (error) {
        console.error(
            "Evaluate job candidate error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to evaluate candidate"
        });
    }
};

module.exports = {
    evaluateJobCandidate
};