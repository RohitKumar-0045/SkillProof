const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { clerkMiddleware, requireAuth } = require("@clerk/express");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes")
const githubRoutes = require("./routes/githubRoutes");
const evidenceRoutes = require("./routes/evidenceRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const jobApplicationRoutes = require("./routes/jobApplicationRoutes");
const savedCandidateRoutes = require("./routes/savedCandidateRoutes");
const recruiterAiRoutes = require("./routes/recruiterAiRoutes");

const jobRoutes = require("./routes/jobRoutes");



const connectDB = require("./config/db")

const app = express();

app.use(cors());
app.use(express.json());

app.use(clerkMiddleware());

connectDB();

app.get("/", (req, res) => {
    res.json({
        message: "SkillProof Backend is running"
    });
});

app.get("/api/protected", requireAuth(), (req, res) => {
    res.json({
        message: "You are authenticated!",
        userId: req.auth.userId
    });
});

app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/evidence", evidenceRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/job-applications", jobApplicationRoutes);
app.use("/api/saved-candidates", savedCandidateRoutes);
app.use("/api/recruiter-ai", recruiterAiRoutes);


app.listen(5000, () => {
    console.log(`Server running on port ${5000}`);
})