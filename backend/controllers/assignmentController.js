const { getAuth } = require("@clerk/express");
const Assignment = require("../models/Assignments");
const User = require("../models/User");

const createAssignment = async (req, res) => {
    try {
        const { isAuthenticated, userId: clerkId } = getAuth(req);

        if (!isAuthenticated || !clerkId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const user = await User.findOne({ clerkId });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.role !== "recruiter") {
            return res.status(403).json({
                message: "Only recruiters can create assignments"
            });
        }

        const {
            title,
            description,
            skills,
            difficulty,
            deadline,
            status
        } = req.body;

        if (!title || !description || !deadline) {
            return res.status(400).json({
                message: "Title, description and deadline are required"
            });
        }

        const assignment = await Assignment.create({
            createdBy: user._id,
            title,
            description,
            skills: Array.isArray(skills) ? skills : [],
            difficulty: difficulty || "Easy",
            deadline,
            status: status || "published"
        });

        res.status(201).json({
            message: "Assignment created successfully",
            assignment
        });
    } catch (error) {
        console.error("Create assignment error:", error);

        res.status(500).json({
            message: "Failed to create assignment"
        });
    }
};


const getMyAssignments = async (req, res) => {
    try {
        const { isAuthenticated, userId: clerkId } = getAuth(req);

        if (!isAuthenticated || !clerkId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const user = await User.findOne({ clerkId });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.role !== "recruiter") {
            return res.status(403).json({
                message: "Only recruiters can access this"
            });
        }

        const assignments = await Assignment.find({
            createdBy: user._id
        }).sort({ createdAt: -1 });

        res.status(200).json({
            assignments
        });
    } catch (error) {
        console.error("Get my assignments error:", error);

        res.status(500).json({
            message: "Failed to fetch assignments"
        });
    }
};


const getPublishedAssignments = async (req, res) => {
    try {
        const { isAuthenticated, userId: clerkId } = getAuth(req);

        if (!isAuthenticated || !clerkId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const user = await User.findOne({ clerkId });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.role !== "student") {
            return res.status(403).json({
                message: "Only students can access published assignments"
            });
        }

        const assignments = await Assignment.find({
            status: "published",
            deadline: { $gte: new Date() }
        })
            .populate("createdBy", "firstName lastName email")
            .sort({ deadline: 1 });

        res.status(200).json({
            assignments
        });
    } catch (error) {
        console.error("Get published assignments error:", error);

        res.status(500).json({
            message: "Failed to fetch assignments"
        });
    }
};


const getAssignmentById = async (req, res) => {
    try {
        const { isAuthenticated, userId: clerkId } = getAuth(req);

        if (!isAuthenticated || !clerkId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const user = await User.findOne({ clerkId });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const assignment = await Assignment.findById(req.params.id)
            .populate("createdBy", "firstName lastName email");

        if (!assignment) {
            return res.status(404).json({
                message: "Assignment not found"
            });
        }

        res.status(200).json({
            assignment
        });
    } catch (error) {
        console.error("Get assignment error:", error);

        res.status(500).json({
            message: "Failed to fetch assignment"
        });
    }
};


const updateAssignment = async (req, res) => {
    try {
        const { isAuthenticated, userId: clerkId } = getAuth(req);

        if (!isAuthenticated || !clerkId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const user = await User.findOne({ clerkId });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.role !== "recruiter") {
            return res.status(403).json({
                message: "Only recruiters can update assignments"
            });
        }

        const assignment = await Assignment.findOne({
            _id: req.params.id,
            createdBy: user._id
        });

        if (!assignment) {
            return res.status(404).json({
                message: "Assignment not found"
            });
        }

        const {
            title,
            description,
            skills,
            difficulty,
            deadline,
            status
        } = req.body;

        if (title !== undefined) {
            assignment.title = title;
        }

        if (description !== undefined) {
            assignment.description = description;
        }

        if (skills !== undefined) {
            assignment.skills = Array.isArray(skills) ? skills : [];
        }

        if (difficulty !== undefined) {
            assignment.difficulty = difficulty;
        }

        if (deadline !== undefined) {
            assignment.deadline = deadline;
        }

        if (status !== undefined) {
            assignment.status = status;
        }

        await assignment.save();

        res.status(200).json({
            message: "Assignment updated successfully",
            assignment
        });
    } catch (error) {
        console.error("Update assignment error:", error);

        res.status(500).json({
            message: "Failed to update assignment"
        });
    }
};


const deleteAssignment = async (req, res) => {
    try {
        const { isAuthenticated, userId: clerkId } = getAuth(req);

        if (!isAuthenticated || !clerkId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const user = await User.findOne({ clerkId });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.role !== "recruiter") {
            return res.status(403).json({
                message: "Only recruiters can delete assignments"
            });
        }

        const assignment = await Assignment.findOneAndDelete({
            _id: req.params.id,
            createdBy: user._id
        });

        if (!assignment) {
            return res.status(404).json({
                message: "Assignment not found"
            });
        }

        res.status(200).json({
            message: "Assignment deleted successfully"
        });
    } catch (error) {
        console.error("Delete assignment error:", error);

        res.status(500).json({
            message: "Failed to delete assignment"
        });
    }
};


module.exports = {
    createAssignment,
    getMyAssignments,
    getPublishedAssignments,
    getAssignmentById,
    updateAssignment,
    deleteAssignment
};