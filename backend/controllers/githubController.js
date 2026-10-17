const axios = require("axios");
const crypto = require("crypto");
const User = require("../models/User");
const { getAuth } = require("@clerk/express");

const connectGitHub = async (req, res) => {
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

        const state = crypto.randomBytes(32).toString("hex");

        user.github = {
            ...(user.github?.toObject?.() || user.github || {}),
            oauthState: state,
            oauthStateExpiresAt: new Date(
                Date.now() + 10 * 60 * 1000
            )
        };

        await user.save();

        const githubUrl =
            "https://github.com/login/oauth/authorize" +
            `?client_id=${encodeURIComponent(process.env.GITHUB_CLIENT_ID)}` +
            `&redirect_uri=${encodeURIComponent(process.env.GITHUB_CALLBACK_URL)}` +
            `&scope=${encodeURIComponent("read:user user:email repo")}` +
            `&state=${encodeURIComponent(state)}`;

        return res.status(200).json({
            githubUrl
        });
    } catch (error) {
        console.error(
            "GitHub connect error:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            message: "Failed to connect GitHub"
        });
    }
};

const githubCallback = async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code || !state) {
            return res.status(400).send(
                "Invalid GitHub callback"
            );
        }

        const user = await User.findOne({
            "github.oauthState": state,
            "github.oauthStateExpiresAt": {
                $gt: new Date()
            }
        });

        if (!user) {
            return res.status(400).send(
                "Invalid or expired GitHub authorization"
            );
        }

        const tokenResponse = await axios.post(
            "https://github.com/login/oauth/access_token",
            {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: process.env.GITHUB_CALLBACK_URL
            },
            {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                }
            }
        );

        if (
            tokenResponse.data.error ||
            !tokenResponse.data.access_token
        ) {
            console.error(
                "GitHub token error:",
                tokenResponse.data
            );

            return res.status(400).send(
                "Failed to obtain GitHub access token"
            );
        }

        const accessToken =
            tokenResponse.data.access_token;

        const githubUserResponse = await axios.get(
            "https://api.github.com/user",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                    "User-Agent": "SkillProof"
                }
            }
        );

        const githubUser = githubUserResponse.data;

        user.github.id = String(githubUser.id);
        user.github.username = githubUser.login;
        user.github.avatarUrl = githubUser.avatar_url || "";
        user.github.accessToken = accessToken;
        user.github.connectedAt = new Date();
        user.github.oauthState = "";
        user.github.oauthStateExpiresAt = null;

        await user.save();

        console.log(
            "GitHub connected successfully:",
            githubUser.login
        );

        return res.redirect(
            `${process.env.FRONTEND_URL}/?github=connected`
        );
    } catch (error) {
        console.error(
            "GitHub callback error:",
            error.response?.data || error.message
        );

        return res.status(500).send(
            "GitHub connection failed"
        );
    }
};

const getGitHubConnection = async (req, res) => {
    try {
        const { isAuthenticated, userId } = getAuth(req);

        if (!isAuthenticated || !userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const user = await User.findOne({
            clerkId: userId
        }).select("github");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            connected: Boolean(
                user.github?.id &&
                user.github?.accessToken
            ),
            github: {
                id: user.github?.id || "",
                username: user.github?.username || "",
                avatarUrl: user.github?.avatarUrl || "",
                connectedAt: user.github?.connectedAt || null
            }
        });
    } catch (error) {
        console.error(
            "GitHub connection fetch error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to get GitHub connection"
        });
    }
};

const getGitHubRepositories = async (req, res) => {
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

        if (!user.github?.accessToken) {
            return res.status(401).json({
                message:
                    "GitHub is not connected. Please connect GitHub again."
            });
        }

        try {
            const response = await axios.get(
                "https://api.github.com/user/repos",
                {
                    headers: {
                        Authorization: `Bearer ${user.github.accessToken}`,
                        Accept: "application/vnd.github+json",
                        "X-GitHub-Api-Version": "2022-11-28",
                        "User-Agent": "SkillProof"
                    },
                    params: {
                        visibility: "all",
                        affiliation: "owner,collaborator,organization_member",
                        sort: "updated",
                        direction: "desc",
                        per_page: 100
                    }
                }
            );

            const repositories = response.data.map((repo) => ({
                id: String(repo.id),
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description || "",
                htmlUrl: repo.html_url,
                language: repo.language || "",
                stars: repo.stargazers_count || 0,
                fork: repo.fork || false
            }));

            return res.status(200).json({
                repositories
            });
        } catch (githubError) {
            console.error(
                "GitHub API error:",
                githubError.response?.data ||
                githubError.message
            );

            if (githubError.response?.status === 401) {
                user.github.accessToken = "";
                await user.save();

                return res.status(401).json({
                    message:
                        "GitHub connection expired. Please reconnect GitHub."
                });
            }

            return res.status(500).json({
                message:
                    "Failed to fetch GitHub repositories"
            });
        }
    } catch (error) {
        console.error(
            "GitHub repositories error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Failed to fetch GitHub repositories"
        });
    }
};

module.exports = {
    connectGitHub,
    githubCallback,
    getGitHubConnection,
    getGitHubRepositories
};