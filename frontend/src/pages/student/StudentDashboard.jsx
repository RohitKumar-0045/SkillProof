import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";

import Sidebar from "../../components/common/Sidebar.jsx";
import Navbar from "../../components/common/Navbar.jsx";
import MySkills from "../../components/students/skills/MySkills.jsx";
import MyProjects from "../../components/students/projects/MyProjects.jsx";
import MyProfile from "../../components/students/profile/MyProfile.jsx";
import MyProofs from "../../components/students/proofs/MyProofs.jsx";
import MyAssignments from "../../components/students/assignments/MyAssignments.jsx";
const API_URL = import.meta.env.VITE_API_URL;
function StudentDashboard({ user }) {

    const { getToken } = useAuth();

    const [activeSection, setActiveSection] = useState("overview");

    const [skillsCount, setSkillsCount] = useState(
        user?.skills?.length || 0
    );

    const [projectsCount, setProjectsCount] = useState(
        user?.projects?.length || 0
    );

    const [proofScore, setProofScore] = useState(0);

    const [jobs, setJobs] = useState([]);
    const [jobLoading, setJobLoading] = useState(false);
    const [jobError, setJobError] = useState("");
    const [selectedJob, setSelectedJob] = useState(null);

    const [applications, setApplications] = useState([]);

    const [coverLetter, setCoverLetter] = useState("");
    const [applying, setApplying] = useState(false);
    const [applicationMessage, setApplicationMessage] = useState("");
    const [applicationError, setApplicationError] = useState("");
    const [applicationStatus, setApplicationStatus] = useState("");

    useEffect(() => {

        setSkillsCount(
            user?.skills?.length || 0
        );

    }, [user]);

    useEffect(() => {

        setProjectsCount(
            user?.projects?.length || 0
        );

    }, [user]);

    useEffect(() => {

        if (activeSection !== "overview") {
            return;
        }

        const fetchProofScore = async () => {

            try {

                const token = await getToken();

                if (!token) {
                    return;
                }

                const response = await fetch(
                    `${API_URL}/api/evidence`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json"
                        }
                    }
                );

                const contentType =
                    response.headers.get("content-type");

                if (!contentType?.includes("application/json")) {

                    const text = await response.text();

                    console.error(
                        "Expected JSON but received:",
                        text.substring(0, 300)
                    );

                    throw new Error(
                        "Backend did not return JSON"
                    );
                }

                const data = await response.json();

                console.log(
                    "Evidence response:",
                    data
                );

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Failed to fetch evidence"
                    );
                }

                const evidence =
                    data.evidence || [];

                const projectEvidence =
                    evidence.filter(
                        (item) =>
                            item.type === "github" &&
                            item.aiAnalysis &&
                            typeof item.aiAnalysis.score === "number"
                    );

                console.log(
                    "Project evidence:",
                    projectEvidence
                );

                if (projectEvidence.length === 0) {

                    setProofScore(0);

                    return;
                }

                const totalScore =
                    projectEvidence.reduce(
                        (sum, item) =>
                            sum +
                            Number(
                                item.aiAnalysis.score
                            ),
                        0
                    );

                const averageScore =
                    totalScore /
                    projectEvidence.length;

                const finalScore =
                    Math.round(averageScore);

                console.log(
                    "Proof Score:",
                    finalScore
                );

                setProofScore(finalScore);

            } catch (error) {

                console.error(
                    "Error fetching proof score:",
                    error
                );

                setProofScore(0);
            }
        };

        fetchProofScore();

    }, [getToken, activeSection]);

    const fetchJobs = async () => {

        try {

            setJobLoading(true);
            setJobError("");

            const response = await fetch(
                `${API_URL}/api/jobs/published`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to fetch jobs"
                );
            }

            setJobs(data.jobs || []);

        } catch (error) {

            console.error(
                "Fetch jobs error:",
                error
            );

            setJobError(error.message);

        } finally {

            setJobLoading(false);
        }
    };

    const fetchMyApplications = async () => {

        try {

            const token = await getToken();

            if (!token) {
                return;
            }

            const response = await fetch(
                `${API_URL}/api/job-applications/my`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to fetch applications"
                );
            }

            setApplications(
                data.applications || []
            );

        } catch (error) {

            console.error(
                "Fetch applications error:",
                error
            );
        }
    };

    useEffect(() => {

        if (activeSection !== "jobs") {
            return;
        }

        const loadJobsData = async () => {

            await Promise.all([
                fetchJobs(),
                fetchMyApplications()
            ]);

        };

        loadJobsData();

    }, [activeSection]);

    const handleApplyForJob = async () => {

        if (!selectedJob) {
            return;
        }

        try {

            setApplying(true);
            setApplicationMessage("");
            setApplicationError("");

            const token = await getToken();

            if (!token) {
                throw new Error(
                    "Authentication required"
                );
            }

            const response = await fetch(
                `${API_URL}/api/job-applications/${selectedJob._id}/apply`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        coverLetter
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to submit application"
                );
            }

            setApplicationStatus("applied");

            setApplications((prev) => [
                ...prev,
                {
                    job: {
                        _id: selectedJob._id
                    },
                    status: "applied"
                }
            ]);

            setApplicationMessage(
                "Application submitted successfully!"
            );

            setCoverLetter("");

        } catch (error) {

            console.error(
                "Apply for job error:",
                error
            );

            setApplicationError(
                error.message
            );

        } finally {

            setApplying(false);
        }
    };

    const handleWithdrawApplication = async () => {

        if (!selectedJob) {
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to withdraw this application?"
        );

        if (!confirmed) {
            return;
        }

        try {

            setApplying(true);
            setApplicationMessage("");
            setApplicationError("");

            const token = await getToken();

            if (!token) {
                throw new Error(
                    "Authentication required"
                );
            }

            const response = await fetch(
                `${API_URL}/api/job-applications/${selectedJob._id}/withdraw`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to withdraw application"
                );
            }

            setApplicationStatus(
                "withdrawn"
            );

            setApplications((prev) =>
                prev.map((application) =>
                    application.job?._id === selectedJob._id
                        ? {
                            ...application,
                            status: "withdrawn"
                        }
                        : application
                )
            );

            setApplicationMessage(
                "Application withdrawn successfully!"
            );

        } catch (error) {

            console.error(
                "Withdraw application error:",
                error
            );

            setApplicationError(
                error.message
            );

        } finally {

            setApplying(false);
        }
    };

    const handleViewJob = (job) => {

        setSelectedJob(job);

        const existingApplication =
            applications.find(
                (application) =>
                    application.job?._id === job._id
            );

        setApplicationStatus(
            existingApplication?.status || ""
        );

        setCoverLetter("");

        setApplicationMessage("");

        setApplicationError("");
    };

    const handleCloseJob = () => {

        setSelectedJob(null);

        setApplicationStatus("");

        setCoverLetter("");

        setApplicationMessage("");

        setApplicationError("");
    };

    return (
        <div className="flex min-h-screen bg-slate-900">

            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: "#020617",
                        color: "#ffffff",
                        border: "1px solid #1e293b"
                    }
                }}
            />

            <Sidebar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
            />

            <div className="flex flex-1 flex-col">

                <Navbar user={user} />

                <main className="flex-1 p-8">

                    {activeSection === "overview" && (
                        <div>

                            <h1 className="text-3xl font-bold text-white">
                                Dashboard Overview
                            </h1>

                            <p className="mt-2 text-slate-400">
                                Here's an overview of your SkillProof journey.
                            </p>

                            <div className="mt-8 grid gap-6 md:grid-cols-3">

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">

                                    <p className="text-sm text-slate-400">
                                        Skills
                                    </p>

                                    <h2 className="mt-3 text-3xl font-bold text-white">
                                        {skillsCount}
                                    </h2>

                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">

                                    <p className="text-sm text-slate-400">
                                        Projects
                                    </p>

                                    <h2 className="mt-3 text-3xl font-bold text-white">
                                        {projectsCount}
                                    </h2>

                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">

                                    <p className="text-sm text-slate-400">
                                        Proof Score
                                    </p>

                                    <h2 className="mt-3 text-3xl font-bold text-blue-500">
                                        {proofScore}%
                                    </h2>

                                </div>

                            </div>

                        </div>
                    )}

                    {activeSection === "skills" && (
                        <MySkills
                            onSkillsChanged={(updatedSkills) => {
                                setSkillsCount(
                                    updatedSkills.length
                                );
                            }}
                        />
                    )}

                    {activeSection === "projects" && (
                        <MyProjects
                            onProjectsChanged={(updatedProjects) => {
                                setProjectsCount(
                                    updatedProjects.length
                                );
                            }}
                        />
                    )}

                    {activeSection === "jobs" && (
                        <div>

                            <h1 className="text-3xl font-bold text-white">
                                Job Opportunities
                            </h1>

                            <p className="mt-2 text-slate-400">
                                Explore job and internship opportunities posted by recruiters.
                            </p>

                            {jobLoading && (
                                <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950 p-8 text-center">

                                    <p className="text-slate-400">
                                        Loading jobs...
                                    </p>

                                </div>
                            )}

                            {jobError && (
                                <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4">

                                    <p className="text-red-400">
                                        {jobError}
                                    </p>

                                </div>
                            )}

                            {!jobLoading &&
                                !jobError &&
                                jobs.length === 0 && (
                                    <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950 p-8 text-center">

                                        <p className="text-slate-300">
                                            No published jobs available right now.
                                        </p>

                                    </div>
                                )}

                            {!jobLoading &&
                                jobs.length > 0 && (
                                    <div className="mt-8 grid gap-6 md:grid-cols-2">

                                        {jobs.map((job) => (

                                            <div
                                                key={job._id}
                                                className="rounded-xl border border-slate-800 bg-slate-950 p-6"
                                            >

                                                <div className="flex items-start justify-between gap-4">

                                                    <div>

                                                        <h2 className="text-xl font-semibold text-white">
                                                            {job.title}
                                                        </h2>

                                                        <p className="mt-2 text-sm text-slate-400">
                                                            📍 {job.location}
                                                        </p>

                                                    </div>

                                                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                                                        {job.employmentType}
                                                    </span>

                                                </div>

                                                {job.recruiter && (
                                                    <div className="mt-4">

                                                        <p className="text-sm text-slate-400">
                                                            Posted by
                                                        </p>

                                                        <p className="mt-1 text-sm font-medium text-slate-200">
                                                            {job.recruiter.firstName}{" "}
                                                            {job.recruiter.lastName}
                                                        </p>

                                                    </div>
                                                )}

                                                <p className="mt-5 line-clamp-3 text-sm leading-6 text-slate-400">
                                                    {job.description}
                                                </p>

                                                <div className="mt-5 flex flex-wrap gap-2">

                                                    {(job.skills || []).map(
                                                        (skill, index) => (

                                                            <span
                                                                key={`${skill}-${index}`}
                                                                className="rounded-md bg-slate-800 px-3 py-1 text-xs text-slate-300"
                                                            >
                                                                {skill}
                                                            </span>

                                                        )
                                                    )}

                                                </div>

                                                <div className="mt-6 border-t border-slate-800 pt-4">

                                                    <p className="text-xs text-slate-500">
                                                        Application Deadline
                                                    </p>

                                                    <p className="mt-1 text-sm text-slate-300">
                                                        {new Date(
                                                            job.deadline
                                                        ).toLocaleDateString()}
                                                    </p>

                                                </div>

                                                <button
                                                    onClick={() =>
                                                        handleViewJob(job)
                                                    }
                                                    className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                                                >
                                                    View Details
                                                </button>

                                            </div>

                                        ))}

                                    </div>
                                )}

                            {selectedJob && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

                                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-6">

                                        <div className="flex items-start justify-between gap-4">

                                            <div>

                                                <h2 className="text-2xl font-bold text-white">
                                                    {selectedJob.title}
                                                </h2>

                                                <p className="mt-2 text-sm text-slate-400">
                                                    📍 {selectedJob.location}
                                                </p>

                                            </div>

                                            <button
                                                onClick={
                                                    handleCloseJob
                                                }
                                                className="text-2xl text-slate-400 hover:text-white"
                                            >
                                                ×
                                            </button>

                                        </div>

                                        {selectedJob.recruiter && (
                                            <div className="mt-6 rounded-lg bg-slate-900 p-4">

                                                <p className="text-xs text-slate-500">
                                                    Recruiter
                                                </p>

                                                <p className="mt-1 text-sm text-white">
                                                    {selectedJob.recruiter.firstName}{" "}
                                                    {selectedJob.recruiter.lastName}
                                                </p>

                                                <p className="mt-1 text-sm text-slate-400">
                                                    {selectedJob.recruiter.email}
                                                </p>

                                            </div>
                                        )}

                                        <div className="mt-6">

                                            <h3 className="font-semibold text-white">
                                                Job Description
                                            </h3>

                                            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-400">
                                                {selectedJob.description}
                                            </p>

                                        </div>

                                        <div className="mt-6">

                                            <h3 className="font-semibold text-white">
                                                Required Skills
                                            </h3>

                                            <div className="mt-3 flex flex-wrap gap-2">

                                                {(selectedJob.skills || []).map(
                                                    (skill, index) => (

                                                        <span
                                                            key={`${skill}-${index}`}
                                                            className="rounded-md bg-blue-500/10 px-3 py-1.5 text-sm text-blue-400"
                                                        >
                                                            {skill}
                                                        </span>

                                                    )
                                                )}

                                            </div>

                                        </div>

                                        <div className="mt-6 grid grid-cols-2 gap-4">

                                            <div className="rounded-lg bg-slate-900 p-4">

                                                <p className="text-xs text-slate-500">
                                                    Employment
                                                </p>

                                                <p className="mt-1 text-sm text-slate-300">
                                                    {selectedJob.employmentType}
                                                </p>

                                            </div>

                                            <div className="rounded-lg bg-slate-900 p-4">

                                                <p className="text-xs text-slate-500">
                                                    Deadline
                                                </p>

                                                <p className="mt-1 text-sm text-slate-300">
                                                    {new Date(
                                                        selectedJob.deadline
                                                    ).toLocaleDateString()}
                                                </p>

                                            </div>

                                        </div>

                                        <div className="mt-6 border-t border-slate-800 pt-6">

                                            <h3 className="font-semibold text-white">
                                                Apply for this Job
                                            </h3>

                                            {applicationStatus === "applied" ? (

                                                <div className="mt-4 space-y-3">

                                                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">

                                                        <p className="text-sm font-medium text-emerald-400">
                                                            ✓ Application Submitted
                                                        </p>

                                                    </div>

                                                    <button
                                                        onClick={
                                                            handleWithdrawApplication
                                                        }
                                                        disabled={applying}
                                                        className="w-full rounded-lg border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {applying
                                                            ? "Withdrawing..."
                                                            : "Withdraw Application"}
                                                    </button>

                                                </div>

                                            ) : applicationStatus === "withdrawn" ? (

                                                <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900 p-3 text-center">

                                                    <p className="text-sm font-medium text-slate-400">
                                                        Application Withdrawn
                                                    </p>

                                                </div>

                                            ) : applicationStatus === "shortlisted" ? (

                                                <div className="mt-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-center">

                                                    <p className="text-sm font-medium text-blue-400">
                                                        ✓ You have been shortlisted
                                                    </p>

                                                </div>

                                            ) : applicationStatus === "selected" ? (

                                                <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">

                                                    <p className="text-sm font-medium text-emerald-400">
                                                        🎉 You have been selected
                                                    </p>

                                                </div>

                                            ) : applicationStatus === "rejected" ? (

                                                <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center">

                                                    <p className="text-sm font-medium text-red-400">
                                                        Application Rejected
                                                    </p>

                                                </div>

                                            ) : (

                                                <>

                                                    <textarea
                                                        value={coverLetter}
                                                        onChange={(e) =>
                                                            setCoverLetter(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Write a short cover letter..."
                                                        rows="5"
                                                        className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                                                    />

                                                    {applicationMessage && (
                                                        <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">

                                                            <p className="text-sm text-emerald-400">
                                                                {applicationMessage}
                                                            </p>

                                                        </div>
                                                    )}

                                                    {applicationError && (
                                                        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3">

                                                            <p className="text-sm text-red-400">
                                                                {applicationError}
                                                            </p>

                                                        </div>
                                                    )}

                                                    <button
                                                        onClick={
                                                            handleApplyForJob
                                                        }
                                                        disabled={applying}
                                                        className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {applying
                                                            ? "Submitting..."
                                                            : "Apply Now"}
                                                    </button>

                                                </>

                                            )}

                                            {applicationMessage &&
                                                applicationStatus !== "applied" &&
                                                applicationStatus !== "withdrawn" &&
                                                applicationStatus !== "shortlisted" &&
                                                applicationStatus !== "selected" &&
                                                applicationStatus !== "rejected" && (
                                                    <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">

                                                        <p className="text-sm text-emerald-400">
                                                            {applicationMessage}
                                                        </p>

                                                    </div>
                                                )}

                                            {applicationError && (
                                                <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3">

                                                    <p className="text-sm text-red-400">
                                                        {applicationError}
                                                    </p>

                                                </div>
                                            )}

                                        </div>

                                    </div>

                                </div>
                            )}

                        </div>
                    )}

                    {activeSection === "assignments" && (
                        <MyAssignments />
                    )}

                    {activeSection === "proofs" && (
                        <MyProofs />
                    )}

                    {activeSection === "profile" && (
                        <MyProfile />
                    )}

                </main>

            </div>

        </div>
    );
}

export default StudentDashboard;