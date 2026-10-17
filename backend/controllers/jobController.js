const { getAuth } = require("@clerk/express");
const User = require("../models/User");
const Job = require("../models/Job");

const getRecruiter = async (req) => {
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated || !userId) {
        return { error: { status: 401, message: "Unauthorized" } };
    }

    const recruiter = await User.findOne({ clerkId: userId });

    if (!recruiter) {
        return { error: { status: 404, message: "User not found" } };
    }

    if (recruiter.role !== "recruiter") {
        return {
            error: {
                status: 403,
                message: "Only recruiters can manage jobs"
            }
        };
    }

    return { recruiter };
};

const createJob = async (req, res) => {
    try {
        const result = await getRecruiter(req);

        if (result.error) {
            return res
                .status(result.error.status)
                .json({ message: result.error.message });
        }

        const {
            title,
            description,
            skills,
            location,
            employmentType,
            deadline,
            status
        } = req.body;

        if (!title || !description || !deadline) {
            return res.status(400).json({
                message: "Title, description and deadline are required"
            });
        }

        const job = await Job.create({
            recruiter: result.recruiter._id,
            title,
            description,
            skills: Array.isArray(skills) ? skills : [],
            location: location || "Remote",
            employmentType: employmentType || "Full-time",
            deadline,
            status: status || "published"
        });

        return res.status(201).json({
            message: "Job created successfully",
            job
        });
    } catch (error) {
        console.error("Create job error:", error.message);

        return res.status(500).json({
            message: "Failed to create job"
        });
    }
};

const getMyJobs = async (req, res) => {
    try {
        const result = await getRecruiter(req);

        if (result.error) {
            return res
                .status(result.error.status)
                .json({ message: result.error.message });
        }

        const jobs = await Job.find({
            recruiter: result.recruiter._id
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            jobs
        });
    } catch (error) {
        console.error("Get my jobs error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch jobs"
        });
    }
};

const getPublishedJobs = async (req, res) => {
    try {
        const jobs = await Job.find({
            status: "published"
        })
            .populate(
                "recruiter",
                "firstName lastName email college"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            jobs
        });
    } catch (error) {
        console.error("Get published jobs error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch published jobs"
        });
    }
};

const getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate(
            "recruiter",
            "firstName lastName email college"
        );

        if (!job) {
            return res.status(404).json({
                message: "Job not found"
            });
        }

        return res.status(200).json({
            job
        });
    } catch (error) {
        console.error("Get job error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch job"
        });
    }
};

const updateJob = async (req, res) => {
    try {
        const result = await getRecruiter(req);

        if (result.error) {
            return res
                .status(result.error.status)
                .json({ message: result.error.message });
        }

        const job = await Job.findOne({
            _id: req.params.id,
            recruiter: result.recruiter._id
        });

        if (!job) {
            return res.status(404).json({
                message: "Job not found or you do not own this job"
            });
        }

        const {
            title,
            description,
            skills,
            location,
            employmentType,
            deadline,
            status
        } = req.body;

        if (title !== undefined) job.title = title;
        if (description !== undefined) job.description = description;
        if (skills !== undefined) {
            job.skills = Array.isArray(skills) ? skills : [];
        }
        if (location !== undefined) job.location = location;
        if (employmentType !== undefined) {
            job.employmentType = employmentType;
        }
        if (deadline !== undefined) job.deadline = deadline;
        if (status !== undefined) job.status = status;

        await job.save();

        return res.status(200).json({
            message: "Job updated successfully",
            job
        });
    } catch (error) {
        console.error("Update job error:", error.message);

        return res.status(500).json({
            message: "Failed to update job"
        });
    }
};

const deleteJob = async (req, res) => {
    try {
        const result = await getRecruiter(req);

        if (result.error) {
            return res
                .status(result.error.status)
                .json({ message: result.error.message });
        }

        const job = await Job.findOneAndDelete({
            _id: req.params.id,
            recruiter: result.recruiter._id
        });

        if (!job) {
            return res.status(404).json({
                message: "Job not found or you do not own this job"
            });
        }

        return res.status(200).json({
            message: "Job deleted successfully"
        });
    } catch (error) {
        console.error("Delete job error:", error.message);

        return res.status(500).json({
            message: "Failed to delete job"
        });
    }
};

module.exports = {
    createJob,
    getMyJobs,
    getPublishedJobs,
    getJobById,
    updateJob,
    deleteJob
};