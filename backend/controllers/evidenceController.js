const axios = require("axios");
const Evidence = require("../models/Evidence");
const User = require("../models/User");
const Project = require("../models/Project");
const { getAuth } = require("@clerk/express");
const {
    analyzeEvidence: analyzeWithAI
} = require("../services/aiService");

const githubHeaders = (accessToken) => ({
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "SkillProof"
});

const createEvidence = async (req, res) => {
    try {
        const {
            skillName,
            projectId,
            type,
            source
        } = req.body;

        const { isAuthenticated, userId } = getAuth(req);

        if (!isAuthenticated || !userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        if (!skillName || !type) {
            return res.status(400).json({
                message: "Skill name and evidence type are required"
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
                message: "Only students can create evidence"
            });
        }

        let project = null;

        if (projectId) {
            project = await Project.findOne({
                _id: projectId,
                user: user._id
            });

            if (!project) {
                return res.status(404).json({
                    message: "Project not found"
                });
            }
        }

        const normalizedSkillName = skillName.trim();

        const skillExists = user.skills?.some(
            (skill) =>
                skill.name?.toLowerCase() ===
                normalizedSkillName.toLowerCase()
        );

        if (!skillExists) {
            return res.status(400).json({
                message:
                    "The selected skill does not exist in your profile"
            });
        }

        if (
            type === "github" &&
            (!project ||
                !project.githubRepo ||
                !project.githubRepo.id)
        ) {
            return res.status(400).json({
                message:
                    "This project does not have a linked GitHub repository"
            });
        }

        const evidence = await Evidence.create({
            user: user._id,
            skillName: normalizedSkillName,
            project: project ? project._id : null,
            type,
            source: source || {},
            status: "pending"
        });

        return res.status(201).json({
            message: "Evidence created successfully",
            evidence
        });
    } catch (error) {
        console.error(
            "Create evidence error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};

const getMyEvidence = async (req, res) => {
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

        const evidence = await Evidence.find({
            user: user._id
        })
            .populate(
                "project",
                "title description technologies githubUrl githubRepo liveUrl"
            )
            .sort({
                createdAt: -1
            });

        return res.status(200).json({
            evidence
        });
    } catch (error) {
        console.error(
            "Get evidence error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};

const getEvidenceById = async (req, res) => {
    try {
        const { evidenceId } = req.params;

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

        const evidence = await Evidence.findOne({
            _id: evidenceId,
            user: user._id
        }).populate(
            "project",
            "title description technologies githubUrl githubRepo liveUrl"
        );

        if (!evidence) {
            return res.status(404).json({
                message: "Evidence not found"
            });
        }

        return res.status(200).json({
            evidence
        });
    } catch (error) {
        console.error(
            "Get evidence by id error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};

const getRepositoryTree = async (
    fullName,
    defaultBranch,
    accessToken
) => {
    const response = await axios.get(
        `https://api.github.com/repos/${fullName}/git/trees/${encodeURIComponent(
            defaultBranch
        )}`,
        {
            headers: githubHeaders(accessToken),
            params: {
                recursive: "1"
            }
        }
    );

    return response.data.tree || [];
};

const getRepositoryFile = async (
    fullName,
    path,
    defaultBranch,
    accessToken
) => {
    try {
        const response = await axios.get(
            `https://api.github.com/repos/${fullName}/contents/${path}`,
            {
                headers: githubHeaders(accessToken),
                params: {
                    ref: defaultBranch
                }
            }
        );

        const data = response.data;

        if (
            !data ||
            data.type !== "file" ||
            !data.content
        ) {
            return null;
        }

        const content = Buffer.from(
            data.content,
            "base64"
        ).toString("utf-8");

        return {
            path,
            content: content.slice(0, 4000)
        };
    } catch (error) {
        console.error(
            `Failed to read ${path}:`,
            error.response?.data ||
            error.message
        );

        return null;
    }
};

const selectImportantFiles = (tree) => {
    const files = tree
        .filter(
            (item) =>
                item.type === "blob" &&
                item.path
        )
        .map((item) => item.path)
        .filter((path) => {
            const lower = path.toLowerCase();

            if (
                lower.includes("node_modules/") ||
                lower.includes("dist/") ||
                lower.includes("build/") ||
                lower.includes(".git/") ||
                lower.includes("coverage/") ||
                lower.includes(".next/") ||
                lower.includes("vendor/")
            ) {
                return false;
            }

            if (
                lower.endsWith("package-lock.json") ||
                lower.endsWith("yarn.lock") ||
                lower.endsWith("pnpm-lock.yaml")
            ) {
                return false;
            }

            return true;
        });

    const priorityFiles = [
        "README.md",
        "readme.md",
        "package.json",
        "requirements.txt",
        "pom.xml",
        "build.gradle",
        "Cargo.toml",
        "src/App.jsx",
        "src/App.js",
        "src/main.jsx",
        "src/main.js",
        "src/index.js",
        "src/index.jsx"
    ];

    const selected = [];

    for (const priority of priorityFiles) {
        const match = files.find(
            (file) =>
                file.toLowerCase() ===
                priority.toLowerCase()
        );

        if (
            match &&
            !selected.includes(match)
        ) {
            selected.push(match);
        }
    }

    const sourceExtensions = [
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".py",
        ".java",
        ".cpp",
        ".c",
        ".h",
        ".html",
        ".css"
    ];

    const sourceFiles = files.filter(
        (file) =>
            sourceExtensions.some((extension) =>
                file
                    .toLowerCase()
                    .endsWith(extension)
            )
    );

    for (const file of sourceFiles) {
        if (selected.length >= 8) {
            break;
        }

        if (!selected.includes(file)) {
            selected.push(file);
        }
    }

    return selected.slice(0, 8);
};

const analyzeEvidence = async (req, res) => {
    let evidence = null;

    try {
        const { evidenceId } = req.params;

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

        evidence = await Evidence.findOne({
            _id: evidenceId,
            user: user._id
        }).populate("project");

        if (!evidence) {
            return res.status(404).json({
                message: "Evidence not found"
            });
        }

        if (evidence.type !== "github") {
            return res.status(400).json({
                message:
                    "AI analysis is currently available for GitHub evidence"
            });
        }

        if (!evidence.project) {
            return res.status(400).json({
                message:
                    "Evidence is not linked to a project"
            });
        }

        if (
            !evidence.project.githubRepo ||
            !evidence.project.githubRepo.id
        ) {
            return res.status(400).json({
                message:
                    "Project does not have a linked GitHub repository"
            });
        }

        if (!user.github?.accessToken) {
            return res.status(401).json({
                message:
                    "GitHub connection expired. Please reconnect GitHub."
            });
        }

        evidence.status = "analyzing";
        await evidence.save();

        const repositoryResponse = await axios.get(
            `https://api.github.com/repositories/${evidence.project.githubRepo.id}`,
            {
                headers: githubHeaders(
                    user.github.accessToken
                )
            }
        );

        const repository =
            repositoryResponse.data;

        const fullName =
            repository.full_name ||
            evidence.project.githubRepo.fullName;

        if (!fullName) {
            throw new Error(
                "GitHub repository name could not be determined"
            );
        }

        const tree = await getRepositoryTree(
            fullName,
            repository.default_branch,
            user.github.accessToken
        );

        const selectedFiles =
            selectImportantFiles(tree);

        const sourceFiles = [];

        for (const path of selectedFiles) {
            const file =
                await getRepositoryFile(
                    fullName,
                    path,
                    repository.default_branch,
                    user.github.accessToken
                );

            if (file) {
                sourceFiles.push(file);
            }
        }

        const aiResult = await analyzeWithAI({
            skillName: evidence.skillName,
            projectTitle:
                evidence.project.title,
            projectDescription:
                evidence.project.description,
            technologies:
                evidence.project.technologies || [],
            repository: {
                name: repository.name,
                fullName:
                    repository.full_name,
                url: repository.html_url,
                language:
                    repository.language || "",
                stars:
                    repository.stargazers_count ||
                    0,
                fork:
                    repository.fork || false
            },
            sourceFiles
        });

        evidence.status = "analyzed";

        evidence.aiAnalysis = {
            score: aiResult.score,
            summary: aiResult.summary,
            strengths:
                aiResult.strengths,
            weaknesses:
                aiResult.weaknesses,
            technologiesDetected:
                aiResult.technologiesDetected,
            analyzedAt: new Date()
        };

        await evidence.save();

        return res.status(200).json({
            message:
                "Evidence analyzed successfully",
            evidence
        });
    } catch (error) {
        console.error(
            "Analyze evidence error:",
            error.response?.data ||
            error.message
        );

        if (evidence) {
            evidence.status = "rejected";
            await evidence.save();
        }

        if (error.response?.status === 401) {
            return res.status(401).json({
                message:
                    "GitHub authorization expired. Please reconnect GitHub."
            });
        }

        if (error.response?.status === 404) {
            return res.status(404).json({
                message:
                    "Linked GitHub repository could not be found."
            });
        }

        return res.status(500).json({
            message:
                error.message ||
                "Failed to analyze evidence"
        });
    }
};

const deleteEvidence = async (req, res) => {
    try {
        const { evidenceId } = req.params;

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

        const evidence =
            await Evidence.findOne({
                _id: evidenceId,
                user: user._id
            });

        if (!evidence) {
            return res.status(404).json({
                message: "Evidence not found"
            });
        }

        await Evidence.findByIdAndDelete(
            evidenceId
        );

        return res.status(200).json({
            message:
                "Evidence deleted successfully"
        });
    } catch (error) {
        console.error(
            "Delete evidence error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    createEvidence,
    getMyEvidence,
    getEvidenceById,
    analyzeEvidence,
    deleteEvidence
};