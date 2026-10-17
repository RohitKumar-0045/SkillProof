const Project = require("../models/Project");
const User = require("../models/User");
const { getAuth } = require("@clerk/express");

const createProject = async (req, res) => {
    try {
        const {
            title,
            description,
            technologies,
            githubUrl,
            githubRepo,
            liveUrl
        } = req.body;

        const { isAuthenticated, userId } = getAuth(req);

        if (!isAuthenticated || !userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        if (!title || !description) {
            return res.status(400).json({
                message: "Title and description are required"
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

        if (user.role !== "student") {
            return res.status(403).json({
                message: "Only students can create projects"
            });
        }

        const normalizedGithubRepo =
            githubRepo && githubRepo.id
                ? {
                    id: String(githubRepo.id),
                    name: githubRepo.name || "",
                    fullName: githubRepo.fullName || "",
                    url:
                        githubRepo.url ||
                        githubRepo.htmlUrl ||
                        ""
                }
                : {
                    id: "",
                    name: "",
                    fullName: "",
                    url: ""
                };

        const project = await Project.create({
            user: user._id,
            title,
            description,
            technologies: technologies || [],
            githubUrl:
                githubUrl ||
                normalizedGithubRepo.url ||
                "",
            githubRepo: normalizedGithubRepo,
            liveUrl: liveUrl || ""
        });

        if (!Array.isArray(user.projects)) {
            user.projects = [];
        }

        user.projects.push(project._id);

        await user.save();

        return res.status(201).json({
            message: "Project created successfully",
            project
        });
    } catch (error) {
        console.error(
            "Create project error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};

const getMyProjects = async (req, res) => {
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

        const projects = await Project.find({
            user: user._id
        }).sort({
            createdAt: -1
        });

        return res.status(200).json({
            projects
        });
    } catch (error) {
        console.error(
            "Get projects error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};

const getProjectById = async (req, res) => {
    try {
        const { projectId } = req.params;

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

        const project = await Project.findOne({
            _id: projectId,
            user: user._id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        return res.status(200).json({
            project
        });
    } catch (error) {
        console.error(
            "Get project error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};

const updateProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        const {
            title,
            description,
            technologies,
            githubUrl,
            githubRepo,
            liveUrl
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

        const project = await Project.findOne({
            _id: projectId,
            user: user._id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        if (title !== undefined) {
            project.title = title;
        }

        if (description !== undefined) {
            project.description = description;
        }

        if (technologies !== undefined) {
            project.technologies = technologies;
        }

        if (githubRepo !== undefined) {
            project.githubRepo =
                githubRepo && githubRepo.id
                    ? {
                        id: String(githubRepo.id),
                        name:
                            githubRepo.name || "",
                        fullName:
                            githubRepo.fullName || "",
                        url:
                            githubRepo.url ||
                            githubRepo.htmlUrl ||
                            ""
                    }
                    : {
                        id: "",
                        name: "",
                        fullName: "",
                        url: ""
                    };
        }

        if (githubUrl !== undefined) {
            project.githubUrl =
                githubUrl ||
                project.githubRepo?.url ||
                "";
        }

        if (liveUrl !== undefined) {
            project.liveUrl = liveUrl;
        }

        await project.save();

        return res.status(200).json({
            message: "Project updated successfully",
            project
        });
    } catch (error) {
        console.error(
            "Update project error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};

const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;

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

        const project = await Project.findOne({
            _id: projectId,
            user: user._id
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        await Project.findByIdAndDelete(projectId);

        if (Array.isArray(user.projects)) {
            user.projects.pull(projectId);
            await user.save();
        }

        return res.status(200).json({
            message: "Project deleted successfully"
        });
    } catch (error) {
        console.error(
            "Delete project error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    createProject,
    getMyProjects,
    getProjectById,
    updateProject,
    deleteProject
};