const express = require("express");

const {
    connectGitHub,
    githubCallback,
    getGitHubConnection,
    getGitHubRepositories
} = require("../controllers/githubController");

const router = express.Router();

router.get("/connect", connectGitHub);

router.get("/callback", githubCallback);

router.get("/connection", getGitHubConnection);

router.get("/repos", getGitHubRepositories);

module.exports = router;