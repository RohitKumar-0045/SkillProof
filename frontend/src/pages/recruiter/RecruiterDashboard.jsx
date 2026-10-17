
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";

import RecruiterSidebar from "../../components/common/RecruiterSidebar.jsx";
import Navbar from "../../components/common/Navbar.jsx";

function RecruiterDashboard({ user }) {
    const {
        getToken,
        isLoaded,
        isSignedIn
    } = useAuth();

    const [activeSection, setActiveSection] = useState("overview");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [assignments, setAssignments] = useState([]);
    const [showAssignmentForm, setShowAssignmentForm] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [skills, setSkills] = useState("");
    const [difficulty, setDifficulty] = useState("Easy");
    const [deadline, setDeadline] = useState("");

    const [jobs, setJobs] = useState([]);
    const [jobLoading, setJobLoading] = useState(false);
    const [jobMessage, setJobMessage] = useState("");
    const [jobError, setJobError] = useState("");
    const [editingJob, setEditingJob] = useState(null);

    const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [loadingApplicants, setLoadingApplicants] = useState(false);
    const [applicantError, setApplicantError] = useState("");

    // AI Candidate Evaluation
    const [evaluatingApplicationId, setEvaluatingApplicationId] = useState(null);
    const [candidateEvaluations, setCandidateEvaluations] = useState({});
    const [evaluationErrors, setEvaluationErrors] = useState({});

    const [viewingResume, setViewingResume] = useState(false);
    const [selectedResumeUrl, setSelectedResumeUrl] = useState("");
    const [selectedResumeName, setSelectedResumeName] = useState("");
    const [selectedResumeResourceType, setSelectedResumeResourceType] = useState("raw");

    const [jobForm, setJobForm] = useState({
        title: "",
        description: "",
        skills: "",
        location: "Remote",
        employmentType: "Full-time",
        deadline: "",
        status: "published"
    });

    // Recruiter Profile
    const [recruiterProfile, setRecruiterProfile] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        designation: "",
        location: "",
        companyName: "",
        companyWebsite: "",
        companyIndustry: "",
        companySize: "",
        companyDescription: "",
        linkedinUrl: "",
        githubUrl: "",
        portfolioUrl: ""
    });

    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMessage, setProfileMessage] = useState("");
    const [profileError, setProfileError] = useState("");

    const [loadingAssignments, setLoadingAssignments] = useState(false);
    const [savingAssignment, setSavingAssignment] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [selectedStudent, setSelectedStudent] = useState(null);

    const [students, setStudents] = useState([]);
    const [studentSearch, setStudentSearch] = useState("");
    const [skillFilter, setSkillFilter] = useState("");
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [savedCandidates, setSavedCandidates] = useState([]);
    const [savingCandidate, setSavingCandidate] = useState(null);
    const [loadingSavedCandidates, setLoadingSavedCandidates] = useState(false);

    const fetchApplicants = async (jobId) => {
        try {
            setLoadingApplicants(true);
            setApplicantError("");

            const token = await getToken();

            const response = await fetch(
                `http://localhost:5000/api/job-applications/${jobId}/applicants`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to fetch applicants"
                );
            }

            setApplicants(data.applications || []);
            setSelectedJobForApplicants(
                jobs.find((job) => job._id === jobId) || null
            );

        } catch (error) {
            console.error(
                "Fetch applicants error:",
                error
            );

            setApplicantError(error.message);
        } finally {
            setLoadingApplicants(false);
        }
    };
    const fetchRecruiterProfile = async () => {
        try {
            setProfileLoading(true);
            setProfileError("");
            setProfileMessage("");

            const token = await getToken();

            const response = await fetch(
                "http://localhost:5000/api/users/me",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to fetch recruiter profile"
                );
            }

            // Support either { user: {...} } or a direct user object.
            const userData = data.user || data;

            setRecruiterProfile((prev) => ({
                ...prev,
                firstName: userData.firstName || "",
                lastName: userData.lastName || "",
                email: userData.email || "",
                phone: userData.phone || "",
                designation: userData.designation || "",
                location: userData.location || "",
                companyName: userData.companyName || "",
                companyWebsite: userData.companyWebsite || "",
                companyIndustry: userData.companyIndustry || "",
                companySize: userData.companySize || "",
                companyDescription: userData.companyDescription || "",
                linkedinUrl: userData.linkedinUrl || "",
                githubUrl: userData.githubUrl || "",
                portfolioUrl: userData.portfolioUrl || "",
            }));
        } catch (error) {
            console.error("Error fetching recruiter profile:", error);
            setProfileError(
                error.message || "Something went wrong while loading your profile."
            );
        } finally {
            setProfileLoading(false);
        }
    };


    const handleSaveRecruiterProfile = async (e) => {
        e.preventDefault();

        try {
            setProfileSaving(true);
            setProfileError("");
            setProfileMessage("");

            const token = await getToken();

            const response = await fetch(
                "http://localhost:5000/api/users/profile",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(recruiterProfile),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to update recruiter profile"
                );
            }

            setProfileMessage("Profile updated successfully! 🎉");

            // Refresh the profile with the saved backend data.
            await fetchRecruiterProfile();
        } catch (error) {
            console.error("Error saving recruiter profile:", error);
            setProfileError(
                error.message || "Something went wrong while saving your profile."
            );
        } finally {
            setProfileSaving(false);
        }
    };
    const handleShortlistApplicant = async (application) => {
        try {
            const token = await getToken();

            if (!token) {
                throw new Error("Authentication required. Please sign in again.");
            }

            const response = await fetch(
                `http://localhost:5000/api/job-applications/${selectedJobForApplicants._id}/${application._id}/status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        status: "shortlisted"
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to shortlist applicant"
                );
            }

            // Update the applicant status immediately in the UI
            setApplicants((previousApplicants) =>
                previousApplicants.map((item) =>
                    item._id === application._id
                        ? { ...item, status: "shortlisted" }
                        : item
                )
            );

            alert("Applicant shortlisted successfully!");

        } catch (error) {
            console.error("Shortlist applicant error:", error);
            alert(error.message || "Failed to shortlist applicant");
        }
    };

    const handleEvaluateCandidate = async (application) => {
        try {
            const jobId = selectedJobForApplicants?._id;
            const applicationId = application?._id;

            if (!jobId || !applicationId) {
                throw new Error("Job or application information is missing.");
            }

            setEvaluatingApplicationId(applicationId);

            setEvaluationErrors((previous) => ({
                ...previous,
                [applicationId]: ""
            }));

            const token = await getToken();

            if (!token) {
                throw new Error("Authentication required. Please sign in again.");
            }

            const response = await fetch(
                `http://localhost:5000/api/recruiter-ai/${jobId}/${applicationId}/evaluate`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to evaluate candidate."
                );
            }

            if (!data.evaluation) {
                throw new Error("The server did not return an evaluation.");
            }

            setCandidateEvaluations((previous) => ({
                ...previous,
                [applicationId]: data.evaluation
            }));

        } catch (error) {
            console.error("AI candidate evaluation error:", error);

            setEvaluationErrors((previous) => ({
                ...previous,
                [application._id]: error.message || "Evaluation failed."
            }));
        } finally {
            setEvaluatingApplicationId(null);
        }
    };
    const fetchJobs = async () => {
        try {
            setJobLoading(true);
            setJobError("");

            const token = await getToken();

            const response = await fetch(
                "http://localhost:5000/api/jobs/my",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch jobs");
            }

            setJobs(data.jobs || []);
        } catch (error) {
            console.error("Fetch jobs error:", error);
            setJobError(error.message);
        } finally {
            setJobLoading(false);
        }
    };

    const handleJobFormChange = (e) => {
        const { name, value } = e.target;

        setJobForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const closeApplicants = () => {
        setSelectedJobForApplicants(null);
        setApplicants([]);
        setApplicantError("");
    };
    const resetJobForm = () => {
        setJobForm({
            title: "",
            description: "",
            skills: "",
            location: "Remote",
            employmentType: "Full-time",
            deadline: "",
            status: "published"
        });

        setEditingJob(null);
        setJobMessage("");
        setJobError("");
    };

    const handleCreateJob = async (e) => {
        e.preventDefault();

        try {
            setJobLoading(true);
            setJobMessage("");
            setJobError("");

            const token = await getToken();

            const response = await fetch(
                "http://localhost:5000/api/jobs",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        ...jobForm,
                        skills: jobForm.skills
                            .split(",")
                            .map((skill) => skill.trim())
                            .filter(Boolean)
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create job");
            }

            setJobMessage("Job posted successfully!");
            resetJobForm();
            await fetchJobs();
        } catch (error) {
            console.error("Create job error:", error);
            setJobError(error.message);
        } finally {
            setJobLoading(false);
        }
    };

    const handleEditJob = (job) => {
        setEditingJob(job);

        setJobForm({
            title: job.title || "",
            description: job.description || "",
            skills: (job.skills || []).join(", "),
            location: job.location || "Remote",
            employmentType: job.employmentType || "Full-time",
            deadline: job.deadline
                ? new Date(job.deadline).toISOString().split("T")[0]
                : "",
            status: job.status || "published"
        });
    };

    const handleUpdateJob = async (e) => {
        e.preventDefault();

        if (!editingJob) return;

        try {
            setJobLoading(true);
            setJobMessage("");
            setJobError("");

            const token = await getToken();

            const response = await fetch(
                `http://localhost:5000/api/jobs/${editingJob._id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        ...jobForm,
                        skills: jobForm.skills
                            .split(",")
                            .map((skill) => skill.trim())
                            .filter(Boolean)
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update job");
            }

            setJobMessage("Job updated successfully!");
            resetJobForm();
            await fetchJobs();
        } catch (error) {
            console.error("Update job error:", error);
            setJobError(error.message);
        } finally {
            setJobLoading(false);
        }
    };

    const handleDeleteJob = async (jobId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this job?"
        );

        if (!confirmed) return;

        try {
            setJobLoading(true);
            setJobMessage("");
            setJobError("");

            const token = await getToken();

            const response = await fetch(
                `http://localhost:5000/api/jobs/${jobId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to delete job");
            }

            setJobMessage("Job deleted successfully!");
            await fetchJobs();
        } catch (error) {
            console.error("Delete job error:", error);
            setJobError(error.message);
        } finally {
            setJobLoading(false);
        }
    };
    const fetchStudents = async () => {
        try {
            console.log("Fetching students...");

            setLoadingStudents(true);
            setError("");

            const token = await getToken();

            console.log(
                "Student fetch token:",
                token ? "YES" : "NO"
            );

            const response = await fetch(
                "http://localhost:5000/api/users/students",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log(
                "Students response status:",
                response.status
            );

            const data = await response.json();

            console.log(
                "Students response:",
                data
            );

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to fetch students"
                );
            }

            setStudents(data.students || []);

        } catch (error) {
            console.error(
                "Fetch students error:",
                error
            );

            setError(error.message);

        } finally {
            setLoadingStudents(false);
        }
    };

    const fetchSavedCandidates = async () => {
        try {
            setLoadingSavedCandidates(true);

            const token = await getToken();

            const response = await fetch(
                "http://localhost:5000/api/saved-candidates",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to fetch saved candidates"
                );
            }

            setSavedCandidates(data.savedCandidates || []);

        } catch (error) {
            console.error(
                "Fetch saved candidates error:",
                error
            );

            setError(error.message);

        } finally {
            setLoadingSavedCandidates(false);
        }
    };

    const handleSaveCandidate = async (studentId) => {
        try {
            setSavingCandidate(studentId);
            setError("");

            const token = await getToken();

            const isSaved = savedCandidates.some(
                (saved) => saved.student?._id === studentId
            );

            const response = await fetch(
                `http://localhost:5000/api/saved-candidates/${studentId}`,
                {
                    method: isSaved ? "DELETE" : "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to update saved candidate"
                );
            }

            await fetchSavedCandidates();

        } catch (error) {
            console.error(
                "Save candidate error:",
                error
            );

            setError(error.message);

        } finally {
            setSavingCandidate(null);
        }
    };
    const fetchAssignments = async () => {
        try {
            setLoadingAssignments(true);
            setError("");

            const token = await getToken();

            const response = await fetch(
                "http://localhost:5000/api/assignments/my",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to fetch assignments"
                );
            }

            setAssignments(
                data.assignments || []
            );

        } catch (error) {
            console.error(
                "Fetch assignments error:",
                error
            );

            setError(error.message);

        } finally {
            setLoadingAssignments(false);
        }
    };
    useEffect(() => {
        if (!isLoaded || !isSignedIn) return;

        if (activeSection === "overview") {
            fetchSavedCandidates();
            fetchJobs();
        }

        if (activeSection === "assignments") {
            fetchAssignments();
        }

        if (activeSection === "discover") {
            fetchStudents();
            fetchSavedCandidates();
        }

        if (activeSection === "saved") {
            fetchSavedCandidates();
        }

        if (activeSection === "jobs") {
            fetchJobs();
        }
    }, [activeSection, isLoaded, isSignedIn]);

    const resetAssignmentForm = () => {
        setTitle("");
        setDescription("");
        setSkills("");
        setDifficulty("Easy");
        setDeadline("");
        setEditingAssignment(null);
        setShowAssignmentForm(false);
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();

        try {
            setSavingAssignment(true);
            setError("");
            setMessage("");

            const token = await getToken();

            const skillsArray = skills
                .split(",")
                .map((skill) => skill.trim())
                .filter(
                    (skill) => skill.length > 0
                );

            const response = await fetch(
                "http://localhost:5000/api/assignments",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title,
                        description,
                        skills: skillsArray,
                        difficulty,
                        deadline,
                        status: "published"
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to create assignment"
                );
            }

            setAssignments((prev) => [
                data.assignment,
                ...prev
            ]);

            setMessage(
                "Assignment created successfully."
            );

            resetAssignmentForm();

        } catch (error) {
            console.error(
                "Create assignment error:",
                error
            );

            setError(error.message);

        } finally {
            setSavingAssignment(false);
        }
    };

    const handleEditAssignment = (
        assignment
    ) => {
        setEditingAssignment(assignment);

        setTitle(
            assignment.title || ""
        );

        setDescription(
            assignment.description || ""
        );

        setSkills(
            assignment.skills?.join(", ") || ""
        );

        setDifficulty(
            assignment.difficulty || "Easy"
        );

        setDeadline(
            assignment.deadline
                ? new Date(
                    assignment.deadline
                )
                    .toISOString()
                    .slice(0, 16)
                : ""
        );

        setShowAssignmentForm(true);
        setMessage("");
        setError("");
    };

    const handleUpdateAssignment = async (
        e
    ) => {
        e.preventDefault();

        if (!editingAssignment) {
            return;
        }

        try {
            setSavingAssignment(true);
            setError("");
            setMessage("");

            const token = await getToken();

            const skillsArray = skills
                .split(",")
                .map((skill) => skill.trim())
                .filter(
                    (skill) => skill.length > 0
                );

            const response = await fetch(
                `http://localhost:5000/api/assignments/${editingAssignment._id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title,
                        description,
                        skills: skillsArray,
                        difficulty,
                        deadline
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to update assignment"
                );
            }

            setAssignments((prev) =>
                prev.map((assignment) =>
                    assignment._id ===
                        data.assignment._id
                        ? data.assignment
                        : assignment
                )
            );

            setMessage(
                "Assignment updated successfully."
            );

            resetAssignmentForm();

        } catch (error) {
            console.error(
                "Update assignment error:",
                error
            );

            setError(error.message);

        } finally {
            setSavingAssignment(false);
        }
    };

    const handleDeleteAssignment = async (
        assignmentId
    ) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this assignment?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setMessage("");

            const token = await getToken();

            const response = await fetch(
                `http://localhost:5000/api/assignments/${assignmentId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to delete assignment"
                );
            }

            setAssignments((prev) =>
                prev.filter(
                    (assignment) =>
                        assignment._id !==
                        assignmentId
                )
            );

            setMessage(
                "Assignment deleted successfully."
            );

        } catch (error) {
            console.error(
                "Delete assignment error:",
                error
            );

            setError(error.message);
        }
    };

    const filteredStudents =
        students.filter((student) => {
            const search =
                studentSearch
                    .trim()
                    .toLowerCase();

            const fullName =
                `${student.firstName || ""} ${student.lastName || ""}`
                    .trim()
                    .toLowerCase();

            const matchesSearch =
                !search ||
                fullName.includes(search) ||
                (student.email || "")
                    .toLowerCase()
                    .includes(search);

            const matchesSkill =
                !skillFilter ||
                student.skills?.some(
                    (skill) =>
                        skill.name
                            ?.toLowerCase() ===
                        skillFilter.toLowerCase()
                );

            return (
                matchesSearch &&
                matchesSkill
            );
        });

    const availableSkills = [
        ...new Set(
            students.flatMap(
                (student) =>
                    student.skills?.map(
                        (skill) =>
                            skill.name
                    ) || []
            )
        )
    ].sort();

    const handleViewStudent = (
        student
    ) => {
        setSelectedStudent(student);
    };

    const handleBackToStudents = () => {
        setSelectedStudent(null);
    };

    return (
        <div className="flex min-h-screen bg-slate-900">

            <RecruiterSidebar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            <div className="flex min-w-0 flex-1 flex-col">

                <Navbar user={user} />

                <main className="flex-1 p-4 sm:p-6 lg:p-8">

                    {activeSection === "overview" && (
                        <div>

                            <h1 className="text-2xl font-bold text-white sm:text-3xl">
                                Recruiter Dashboard
                            </h1>

                            <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
                                Discover talented candidates with real proof
                                of their skills.
                            </p>

                            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-8 lg:grid-cols-3 lg:gap-6">

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 sm:p-6">
                                    <p className="text-sm text-slate-400">
                                        Candidates Viewed
                                    </p>

                                    <h2 className="mt-3 text-3xl font-bold text-white">
                                        0
                                    </h2>
                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 sm:p-6">
                                    <p className="text-sm text-slate-400">
                                        Saved Candidates
                                    </p>

                                    <h2 className="mt-3 text-3xl font-bold text-white">
                                        {savedCandidates.length}
                                    </h2>
                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 sm:p-6">
                                    <p className="text-sm text-slate-400">
                                        Active Job Posts
                                    </p>

                                    <h2 className="mt-3 text-3xl font-bold text-blue-500">
                                        {jobs.filter((job) => job.status === "published").length}
                                    </h2>
                                </div>

                            </div>

                            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5 sm:mt-8 sm:p-6">

                                <h2 className="text-lg font-semibold text-white sm:text-xl">
                                    Start Discovering Talent
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
                                    Explore student profiles backed by projects,
                                    skills, and verified evidence.
                                </p>

                            </div>

                        </div>
                    )}

                    {activeSection === "discover" && (
                        <div>

                            {!selectedStudent ? (
                                <>

                                    <h1 className="text-2xl font-bold text-white sm:text-3xl">
                                        Discover Students
                                    </h1>

                                    <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
                                        Search and explore students based on their
                                        demonstrated skills.
                                    </p>

                                    <div className="mt-6 flex flex-col gap-4 sm:flex-row">

                                        <input
                                            type="text"
                                            value={studentSearch}
                                            onChange={(e) =>
                                                setStudentSearch(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Search students by name or email..."
                                            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
                                        />

                                        <select
                                            value={skillFilter}
                                            onChange={(e) =>
                                                setSkillFilter(
                                                    e.target.value
                                                )
                                            }
                                            className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                                        >

                                            <option value="">
                                                All Skills
                                            </option>

                                            {availableSkills.map(
                                                (skill) => (
                                                    <option
                                                        key={skill}
                                                        value={skill}
                                                    >
                                                        {skill}
                                                    </option>
                                                )
                                            )}

                                        </select>

                                    </div>

                                    {error && (
                                        <div className="mt-6 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
                                            {error}
                                        </div>
                                    )}

                                    {loadingStudents ? (

                                        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
                                            Loading students...
                                        </div>

                                    ) : filteredStudents.length === 0 ? (

                                        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
                                            No students found.
                                        </div>

                                    ) : (

                                        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">

                                            {filteredStudents.map(
                                                (student) => (

                                                    <div
                                                        key={student._id}
                                                        className="rounded-xl border border-slate-800 bg-slate-950 p-5 sm:p-6"
                                                    >

                                                        <div className="flex items-start justify-between gap-4">

                                                            <div>

                                                                <h2 className="text-xl font-semibold text-white">
                                                                    {student.firstName}{" "}
                                                                    {student.lastName}
                                                                </h2>

                                                                <p className="mt-1 text-sm text-slate-500">
                                                                    {student.email}
                                                                </p>

                                                            </div>

                                                            <div className="text-right">

                                                                <p className="text-xs text-slate-500">
                                                                    Proof Score
                                                                </p>

                                                                <p className="mt-1 text-2xl font-bold text-blue-500">
                                                                    {student.proofScore || 0}%
                                                                </p>

                                                            </div>

                                                        </div>

                                                        {student.bio && (
                                                            <p className="mt-4 text-sm leading-6 text-slate-400">
                                                                {student.bio}
                                                            </p>
                                                        )}

                                                        <div className="mt-5">

                                                            <p className="text-sm font-medium text-slate-300">
                                                                Skills
                                                            </p>

                                                            <div className="mt-2 flex flex-wrap gap-2">

                                                                {student.skills?.length > 0 ? (

                                                                    student.skills.map(
                                                                        (
                                                                            skill
                                                                        ) => (

                                                                            <span
                                                                                key={
                                                                                    skill._id ||
                                                                                    skill.name
                                                                                }
                                                                                className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
                                                                            >
                                                                                {
                                                                                    skill.name
                                                                                }
                                                                            </span>

                                                                        )
                                                                    )

                                                                ) : (

                                                                    <span className="text-sm text-slate-500">
                                                                        No skills added
                                                                    </span>

                                                                )}

                                                            </div>

                                                        </div>

                                                        <div className="mt-5 flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">

                                                            <p className="text-sm text-slate-400">
                                                                Projects:{" "}
                                                                <span className="font-semibold text-white">
                                                                    {student.projects?.length || 0}
                                                                </span>
                                                            </p>

                                                            <div className="flex gap-2">

                                                                <button
                                                                    onClick={() =>
                                                                        handleSaveCandidate(student._id)
                                                                    }
                                                                    disabled={savingCandidate === student._id}
                                                                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${savedCandidates.some(
                                                                        (saved) =>
                                                                            saved.student?._id === student._id
                                                                    )
                                                                        ? "border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
                                                                        : "border-slate-700 text-slate-300 hover:bg-slate-800"
                                                                        } disabled:cursor-not-allowed disabled:opacity-50`}
                                                                >
                                                                    {savingCandidate === student._id
                                                                        ? "Saving..."
                                                                        : savedCandidates.some(
                                                                            (saved) =>
                                                                                saved.student?._id === student._id
                                                                        )
                                                                            ? "★ Saved"
                                                                            : "☆ Save"}
                                                                </button>

                                                                <button
                                                                    onClick={() =>
                                                                        handleViewStudent(student)
                                                                    }
                                                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                                                                >
                                                                    View Profile
                                                                </button>

                                                            </div>

                                                        </div>

                                                    </div>

                                                )
                                            )}

                                        </div>

                                    )}

                                </>
                            ) : (

                                <div>

                                    <button
                                        onClick={
                                            handleBackToStudents
                                        }
                                        className="mb-6 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                                    >
                                        ← Back to Students
                                    </button>

                                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 sm:p-8">

                                        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">

                                            <div>

                                                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                                                    {selectedStudent.firstName}{" "}
                                                    {selectedStudent.lastName}
                                                </h1>

                                                <p className="mt-2 text-sm text-slate-400">
                                                    {selectedStudent.email}
                                                </p>

                                                {selectedStudent.college && (
                                                    <p className="mt-2 text-sm text-slate-500">
                                                        {selectedStudent.college}
                                                    </p>
                                                )}

                                                {selectedStudent.location && (
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        {selectedStudent.location}
                                                    </p>
                                                )}

                                            </div>

                                            <div className="rounded-xl border border-blue-900 bg-blue-950/30 px-6 py-4 text-center">

                                                <p className="text-xs text-slate-400">
                                                    Proof Score
                                                </p>

                                                <p className="mt-1 text-3xl font-bold text-blue-500">
                                                    {selectedStudent.proofScore || 0}%
                                                </p>

                                            </div>

                                        </div>

                                        {selectedStudent.bio && (
                                            <div className="mt-8">

                                                <h2 className="text-lg font-semibold text-white">
                                                    About
                                                </h2>

                                                <p className="mt-2 text-sm leading-7 text-slate-400">
                                                    {selectedStudent.bio}
                                                </p>

                                            </div>
                                        )}

                                        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">

                                            {selectedStudent.degree && (
                                                <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">

                                                    <p className="text-xs text-slate-500">
                                                        Degree
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-white">
                                                        {selectedStudent.degree}
                                                    </p>

                                                </div>
                                            )}

                                            {selectedStudent.branch && (
                                                <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">

                                                    <p className="text-xs text-slate-500">
                                                        Branch
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-white">
                                                        {selectedStudent.branch}
                                                    </p>

                                                </div>
                                            )}

                                            {selectedStudent.graduationYear && (
                                                <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">

                                                    <p className="text-xs text-slate-500">
                                                        Graduation Year
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-white">
                                                        {selectedStudent.graduationYear}
                                                    </p>

                                                </div>
                                            )}

                                            {selectedStudent.location && (
                                                <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">

                                                    <p className="text-xs text-slate-500">
                                                        Location
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-white">
                                                        {selectedStudent.location}
                                                    </p>

                                                </div>
                                            )}

                                        </div>

                                        <div className="mt-8">

                                            <h2 className="text-lg font-semibold text-white">
                                                Skills
                                            </h2>

                                            <div className="mt-3 flex flex-wrap gap-2">

                                                {selectedStudent.skills?.length > 0 ? (

                                                    selectedStudent.skills.map(
                                                        (skill) => (

                                                            <span
                                                                key={
                                                                    skill._id ||
                                                                    skill.name
                                                                }
                                                                className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-300"
                                                            >
                                                                {skill.name}

                                                                {skill.level && (
                                                                    <span className="ml-2 text-xs text-slate-500">
                                                                        {
                                                                            skill.level
                                                                        }
                                                                    </span>
                                                                )}
                                                            </span>

                                                        )
                                                    )

                                                ) : (

                                                    <p className="text-sm text-slate-500">
                                                        No skills added.
                                                    </p>

                                                )}

                                            </div>

                                        </div>

                                        <div className="mt-8">

                                            <h2 className="text-lg font-semibold text-white">
                                                Projects
                                            </h2>

                                            {selectedStudent.projects?.length > 0 ? (

                                                <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">

                                                    {selectedStudent.projects.map(
                                                        (project) => (

                                                            <div
                                                                key={
                                                                    project._id
                                                                }
                                                                className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                                                            >

                                                                <h3 className="text-lg font-semibold text-white">
                                                                    {
                                                                        project.title
                                                                    }
                                                                </h3>

                                                                {project.description && (
                                                                    <p className="mt-2 text-sm leading-6 text-slate-400">
                                                                        {
                                                                            project.description
                                                                        }
                                                                    </p>
                                                                )}

                                                                {project.technologies?.length > 0 && (
                                                                    <div className="mt-4 flex flex-wrap gap-2">

                                                                        {project.technologies.map(
                                                                            (
                                                                                technology,
                                                                                index
                                                                            ) => (

                                                                                <span
                                                                                    key={
                                                                                        index
                                                                                    }
                                                                                    className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
                                                                                >
                                                                                    {
                                                                                        technology
                                                                                    }
                                                                                </span>

                                                                            )
                                                                        )}

                                                                    </div>
                                                                )}

                                                                <div className="mt-4 flex flex-wrap gap-4">

                                                                    {project.githubUrl && (
                                                                        <a
                                                                            href={
                                                                                project.githubUrl
                                                                            }
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="text-sm font-medium text-blue-400 hover:text-blue-300"
                                                                        >
                                                                            GitHub →
                                                                        </a>
                                                                    )}

                                                                    {project.githubRepo && (
                                                                        <a
                                                                            href={
                                                                                project.githubRepo
                                                                            }
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="text-sm font-medium text-blue-400 hover:text-blue-300"
                                                                        >
                                                                            Repository →
                                                                        </a>
                                                                    )}

                                                                    {project.liveUrl && (
                                                                        <a
                                                                            href={
                                                                                project.liveUrl
                                                                            }
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="text-sm font-medium text-blue-400 hover:text-blue-300"
                                                                        >
                                                                            Live Demo →
                                                                        </a>
                                                                    )}

                                                                </div>

                                                            </div>

                                                        )
                                                    )}

                                                </div>

                                            ) : (

                                                <p className="mt-3 text-sm text-slate-500">
                                                    No projects added.
                                                </p>

                                            )}

                                        </div>

                                        <div className="mt-8">

                                            <h2 className="text-lg font-semibold text-white">
                                                Project Evidence
                                            </h2>

                                            {selectedStudent.evidence?.length > 0 ? (

                                                <div className="mt-4 space-y-4">

                                                    {selectedStudent.evidence.map(
                                                        (evidence) => (

                                                            <div
                                                                key={
                                                                    evidence._id
                                                                }
                                                                className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                                                            >

                                                                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">

                                                                    <div>

                                                                        <p className="text-sm text-slate-500">
                                                                            Skill
                                                                        </p>

                                                                        <h3 className="mt-1 text-lg font-semibold text-white">
                                                                            {
                                                                                evidence.skillName
                                                                            }
                                                                        </h3>

                                                                        {evidence.source?.repositoryName && (
                                                                            <p className="mt-1 text-sm text-slate-400">
                                                                                Repository:{" "}
                                                                                {
                                                                                    evidence
                                                                                        .source
                                                                                        .repositoryName
                                                                                }
                                                                            </p>
                                                                        )}

                                                                    </div>

                                                                    <div className="text-left sm:text-right">

                                                                        <p className="text-xs text-slate-500">
                                                                            AI Score
                                                                        </p>

                                                                        <p className="mt-1 text-2xl font-bold text-blue-500">
                                                                            {evidence.aiAnalysis?.score || 0}%
                                                                        </p>

                                                                    </div>

                                                                </div>

                                                                {evidence.aiAnalysis?.summary && (
                                                                    <p className="mt-4 text-sm leading-6 text-slate-400">
                                                                        {
                                                                            evidence
                                                                                .aiAnalysis
                                                                                .summary
                                                                        }
                                                                    </p>
                                                                )}

                                                                {evidence.aiAnalysis?.technologiesDetected?.length > 0 && (
                                                                    <div className="mt-4">

                                                                        <p className="text-sm font-medium text-slate-300">
                                                                            Technologies Detected
                                                                        </p>

                                                                        <div className="mt-2 flex flex-wrap gap-2">

                                                                            {evidence.aiAnalysis.technologiesDetected.map(
                                                                                (
                                                                                    technology,
                                                                                    index
                                                                                ) => (

                                                                                    <span
                                                                                        key={
                                                                                            index
                                                                                        }
                                                                                        className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
                                                                                    >
                                                                                        {
                                                                                            technology
                                                                                        }
                                                                                    </span>

                                                                                )
                                                                            )}

                                                                        </div>

                                                                    </div>
                                                                )}

                                                                {evidence.aiAnalysis?.strengths?.length > 0 && (
                                                                    <div className="mt-4">

                                                                        <p className="text-sm font-medium text-slate-300">
                                                                            Strengths
                                                                        </p>

                                                                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-400">

                                                                            {evidence.aiAnalysis.strengths.map(
                                                                                (
                                                                                    strength,
                                                                                    index
                                                                                ) => (

                                                                                    <li
                                                                                        key={
                                                                                            index
                                                                                        }
                                                                                    >
                                                                                        {
                                                                                            strength
                                                                                        }
                                                                                    </li>

                                                                                )
                                                                            )}

                                                                        </ul>

                                                                    </div>
                                                                )}

                                                                {evidence.aiAnalysis?.weaknesses?.length > 0 && (
                                                                    <div className="mt-4">

                                                                        <p className="text-sm font-medium text-slate-300">
                                                                            Areas to Improve
                                                                        </p>

                                                                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-400">

                                                                            {evidence.aiAnalysis.weaknesses.map(
                                                                                (
                                                                                    weakness,
                                                                                    index
                                                                                ) => (

                                                                                    <li
                                                                                        key={
                                                                                            index
                                                                                        }
                                                                                    >
                                                                                        {
                                                                                            weakness
                                                                                        }
                                                                                    </li>

                                                                                )
                                                                            )}

                                                                        </ul>

                                                                    </div>
                                                                )}

                                                                {evidence.source?.repositoryUrl && (
                                                                    <a
                                                                        href={
                                                                            evidence
                                                                                .source
                                                                                .repositoryUrl
                                                                        }
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="mt-5 inline-block text-sm font-medium text-blue-400 hover:text-blue-300"
                                                                    >
                                                                        View Repository →
                                                                    </a>
                                                                )}

                                                            </div>

                                                        )
                                                    )}

                                                </div>

                                            ) : (

                                                <p className="mt-3 text-sm text-slate-500">
                                                    No project evidence available.
                                                </p>

                                            )}

                                        </div>

                                    </div>

                                </div>

                            )}

                        </div>
                    )}

                    {activeSection === "saved" && (
                        <div>

                            <h1 className="text-2xl font-bold text-white sm:text-3xl">
                                Saved Candidates
                            </h1>

                            <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
                                Candidates you saved for future opportunities.
                            </p>

                            {loadingSavedCandidates ? (
                                <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
                                    Loading saved candidates...
                                </div>
                            ) : savedCandidates.length === 0 ? (
                                <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-8 text-center">
                                    <p className="text-lg font-medium text-slate-300">
                                        No saved candidates yet.
                                    </p>

                                    <p className="mt-2 text-sm text-slate-500">
                                        Go to Discover Students and save candidates you want to review later.
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">

                                    {savedCandidates.map((saved) => {
                                        const student = saved.student;

                                        if (!student) return null;

                                        return (
                                            <div
                                                key={saved._id}
                                                className="rounded-xl border border-slate-800 bg-slate-950 p-5 sm:p-6"
                                            >

                                                <div className="flex items-start justify-between gap-4">

                                                    <div>
                                                        <h2 className="text-xl font-semibold text-white">
                                                            {student.firstName}{" "}
                                                            {student.lastName}
                                                        </h2>

                                                        <p className="mt-1 text-sm text-slate-500">
                                                            {student.email}
                                                        </p>
                                                    </div>

                                                    <div className="text-right">
                                                        <p className="text-xs text-slate-500">
                                                            Proof Score
                                                        </p>

                                                        <p className="mt-1 text-2xl font-bold text-blue-500">
                                                            {student.proofScore || 0}%
                                                        </p>
                                                    </div>

                                                </div>

                                                {student.bio && (
                                                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-400">
                                                        {student.bio}
                                                    </p>
                                                )}

                                                <div className="mt-4 flex flex-wrap gap-2">

                                                    {student.skills?.length > 0 ? (
                                                        student.skills.slice(0, 6).map((skill) => (
                                                            <span
                                                                key={skill._id || skill.name}
                                                                className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
                                                            >
                                                                {skill.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-sm text-slate-500">
                                                            No skills added
                                                        </span>
                                                    )}

                                                </div>

                                                <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-800 pt-4">

                                                    <button
                                                        onClick={() => handleViewStudent(student)}
                                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                                                    >
                                                        View Profile
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleSaveCandidate(student._id)
                                                        }
                                                        disabled={
                                                            savingCandidate === student._id
                                                        }
                                                        className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {savingCandidate === student._id
                                                            ? "Removing..."
                                                            : "Remove"}
                                                    </button>

                                                </div>

                                            </div>
                                        );
                                    })}

                                </div>
                            )}

                        </div>
                    )}

                    {activeSection === "jobs" && (
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    Job Posts
                                </h1>

                                <p className="mt-1 text-sm text-slate-400">
                                    Create and manage your job opportunities.
                                </p>
                            </div>

                            {jobMessage && (
                                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                                    {jobMessage}
                                </div>
                            )}

                            {jobError && (
                                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                    {jobError}
                                </div>
                            )}

                            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                                <div className="mb-6 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">
                                            {editingJob ? "Edit Job" : "Create New Job"}
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-400">
                                            {editingJob
                                                ? "Update the details of your job post."
                                                : "Post a new opportunity for students."}
                                        </p>
                                    </div>

                                    {editingJob && (
                                        <button
                                            onClick={resetJobForm}
                                            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                </div>

                                <form
                                    onSubmit={
                                        editingJob
                                            ? handleUpdateJob
                                            : handleCreateJob
                                    }
                                    className="space-y-5"
                                >
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                                Job Title
                                            </label>

                                            <input
                                                type="text"
                                                name="title"
                                                value={jobForm.title}
                                                onChange={handleJobFormChange}
                                                placeholder="Frontend Developer Intern"
                                                required
                                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                                Location
                                            </label>

                                            <input
                                                type="text"
                                                name="location"
                                                value={jobForm.location}
                                                onChange={handleJobFormChange}
                                                placeholder="Remote / Chennai"
                                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-300">
                                            Description
                                        </label>

                                        <textarea
                                            name="description"
                                            value={jobForm.description}
                                            onChange={handleJobFormChange}
                                            placeholder="Describe the role, responsibilities and requirements..."
                                            rows="5"
                                            required
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-300">
                                            Skills
                                        </label>

                                        <input
                                            type="text"
                                            name="skills"
                                            value={jobForm.skills}
                                            onChange={handleJobFormChange}
                                            placeholder="React, JavaScript, Node.js, MongoDB"
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                                        />

                                        <p className="mt-1 text-xs text-slate-500">
                                            Separate skills with commas.
                                        </p>
                                    </div>

                                    <div className="grid gap-5 md:grid-cols-3">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                                Employment Type
                                            </label>

                                            <select
                                                name="employmentType"
                                                value={jobForm.employmentType}
                                                onChange={handleJobFormChange}
                                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                                            >
                                                <option value="Full-time">
                                                    Full-time
                                                </option>
                                                <option value="Part-time">
                                                    Part-time
                                                </option>
                                                <option value="Internship">
                                                    Internship
                                                </option>
                                                <option value="Contract">
                                                    Contract
                                                </option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                                Deadline
                                            </label>

                                            <input
                                                type="date"
                                                name="deadline"
                                                value={jobForm.deadline}
                                                onChange={handleJobFormChange}
                                                required
                                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                                Status
                                            </label>

                                            <select
                                                name="status"
                                                value={jobForm.status}
                                                onChange={handleJobFormChange}
                                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                                            >
                                                <option value="published">
                                                    Published
                                                </option>
                                                <option value="draft">
                                                    Draft
                                                </option>
                                                <option value="closed">
                                                    Closed
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={jobLoading}
                                        className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {jobLoading
                                            ? "Saving..."
                                            : editingJob
                                                ? "Update Job"
                                                : "Post Job"}
                                    </button>
                                </form>
                            </div>

                            <div>
                                <div className="mb-4">
                                    <h2 className="text-lg font-semibold text-white">
                                        Your Job Posts
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-400">
                                        Manage the opportunities you have created.
                                    </p>
                                </div>

                                {jobLoading && jobs.length === 0 ? (
                                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
                                        Loading jobs...
                                    </div>
                                ) : jobs.length === 0 ? (
                                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
                                        <p className="text-slate-300">
                                            No job posts yet.
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Create your first job opportunity above.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-5 lg:grid-cols-2">
                                        {jobs.map((job) => (
                                            <div
                                                key={job._id}
                                                className="rounded-xl border border-slate-800 bg-slate-900 p-6"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-white">
                                                            {job.title}
                                                        </h3>

                                                        <p className="mt-1 text-sm text-slate-400">
                                                            📍 {job.location}
                                                        </p>
                                                    </div>

                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-medium ${job.status === "published"
                                                            ? "bg-emerald-500/10 text-emerald-400"
                                                            : job.status === "draft"
                                                                ? "bg-yellow-500/10 text-yellow-400"
                                                                : "bg-red-500/10 text-red-400"
                                                            }`}
                                                    >
                                                        {job.status}
                                                    </span>
                                                </div>

                                                <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-400">
                                                    {job.description}
                                                </p>

                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {(job.skills || []).map(
                                                        (skill, index) => (
                                                            <span
                                                                key={`${skill}-${index}`}
                                                                className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
                                                            >
                                                                {skill}
                                                            </span>
                                                        )
                                                    )}
                                                </div>

                                                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-800 pt-4">
                                                    <div>
                                                        <p className="text-xs text-slate-500">
                                                            Employment
                                                        </p>

                                                        <p className="mt-1 text-sm text-slate-300">
                                                            {job.employmentType}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-slate-500">
                                                            Deadline
                                                        </p>

                                                        <p className="mt-1 text-sm text-slate-300">
                                                            {new Date(
                                                                job.deadline
                                                            ).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                    <button
                                                        onClick={() =>
                                                            fetchApplicants(job._id)
                                                        }
                                                        className="rounded-lg border border-blue-500/30 px-4 py-2 text-sm font-medium text-blue-400 transition hover:bg-blue-500/10"
                                                    >
                                                        View Applicants
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleEditJob(job)
                                                        }
                                                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleDeleteJob(job._id)
                                                        }
                                                        className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection === "assignments" && (
                        <div>

                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                                <div>

                                    <h1 className="text-2xl font-bold text-white sm:text-3xl">
                                        Assignments
                                    </h1>

                                    <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
                                        Create and manage assignments for students.
                                    </p>

                                </div>

                                {!showAssignmentForm && (
                                    <button
                                        onClick={() => {
                                            setShowAssignmentForm(
                                                true
                                            );
                                            setMessage("");
                                            setError("");
                                        }}
                                        className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-500"
                                    >
                                        + Create Assignment
                                    </button>
                                )}

                            </div>

                            {message && (
                                <div className="mt-5 rounded-lg border border-green-800 bg-green-950/40 px-4 py-3 text-sm text-green-400">
                                    {message}
                                </div>
                            )}

                            {error && (
                                <div className="mt-5 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
                                    {error}
                                </div>
                            )}

                            {showAssignmentForm && (
                                <form
                                    onSubmit={
                                        editingAssignment
                                            ? handleUpdateAssignment
                                            : handleCreateAssignment
                                    }
                                    className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5 sm:p-6"
                                >

                                    <h2 className="text-xl font-semibold text-white">
                                        {editingAssignment
                                            ? "Edit Assignment"
                                            : "Create Assignment"}
                                    </h2>

                                    <div className="mt-6 space-y-5">

                                        <div>

                                            <label className="text-sm font-medium text-slate-300">
                                                Assignment Title
                                            </label>

                                            <input
                                                type="text"
                                                value={title}
                                                onChange={(e) =>
                                                    setTitle(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Enter assignment title"
                                                required
                                                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                                            />

                                        </div>

                                        <div>

                                            <label className="text-sm font-medium text-slate-300">
                                                Description
                                            </label>

                                            <textarea
                                                value={description}
                                                onChange={(e) =>
                                                    setDescription(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Describe the assignment..."
                                                rows="5"
                                                required
                                                className="mt-2 w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                                            />

                                        </div>

                                        <div>

                                            <label className="text-sm font-medium text-slate-300">
                                                Skills
                                            </label>

                                            <input
                                                type="text"
                                                value={skills}
                                                onChange={(e) =>
                                                    setSkills(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="JavaScript, React, Node.js"
                                                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                                            />

                                            <p className="mt-1 text-xs text-slate-500">
                                                Separate multiple skills with commas.
                                            </p>

                                        </div>

                                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                            <div>

                                                <label className="text-sm font-medium text-slate-300">
                                                    Difficulty
                                                </label>

                                                <select
                                                    value={difficulty}
                                                    onChange={(e) =>
                                                        setDifficulty(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                                                >

                                                    <option value="Easy">
                                                        Easy
                                                    </option>

                                                    <option value="Medium">
                                                        Medium
                                                    </option>

                                                    <option value="Hard">
                                                        Hard
                                                    </option>

                                                </select>

                                            </div>

                                            <div>

                                                <label className="text-sm font-medium text-slate-300">
                                                    Deadline
                                                </label>

                                                <input
                                                    type="datetime-local"
                                                    value={deadline}
                                                    onChange={(e) =>
                                                        setDeadline(
                                                            e.target.value
                                                        )
                                                    }
                                                    required
                                                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                                                />

                                            </div>

                                        </div>

                                    </div>

                                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">

                                        <button
                                            type="button"
                                            onClick={
                                                resetAssignmentForm
                                            }
                                            className="rounded-lg border border-slate-700 px-5 py-3 font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={
                                                savingAssignment
                                            }
                                            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {savingAssignment
                                                ? "Saving..."
                                                : editingAssignment
                                                    ? "Update Assignment"
                                                    : "Publish Assignment"}
                                        </button>

                                    </div>

                                </form>
                            )}

                            <div className="mt-8">

                                <h2 className="text-xl font-semibold text-white">
                                    Your Assignments
                                </h2>

                                {loadingAssignments ? (

                                    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
                                        Loading assignments...
                                    </div>

                                ) : assignments.length === 0 ? (

                                    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
                                        No assignments created yet.
                                    </div>

                                ) : (

                                    <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">

                                        {assignments.map(
                                            (assignment) => (

                                                <div
                                                    key={
                                                        assignment._id
                                                    }
                                                    className="rounded-xl border border-slate-800 bg-slate-950 p-5 sm:p-6"
                                                >

                                                    <div className="flex items-start justify-between gap-4">

                                                        <h3 className="text-lg font-semibold text-white">
                                                            {
                                                                assignment.title
                                                            }
                                                        </h3>

                                                        <span className="rounded-full bg-blue-950 px-3 py-1 text-xs font-medium text-blue-400">
                                                            {
                                                                assignment.difficulty
                                                            }
                                                        </span>

                                                    </div>

                                                    <p className="mt-3 text-sm leading-6 text-slate-400">
                                                        {
                                                            assignment.description
                                                        }
                                                    </p>

                                                    {assignment.skills?.length > 0 && (
                                                        <div className="mt-4 flex flex-wrap gap-2">

                                                            {assignment.skills.map(
                                                                (
                                                                    skill,
                                                                    index
                                                                ) => (

                                                                    <span
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
                                                                    >
                                                                        {
                                                                            skill
                                                                        }
                                                                    </span>

                                                                )
                                                            )}

                                                        </div>
                                                    )}

                                                    <p className="mt-4 text-sm text-slate-500">
                                                        Deadline:{" "}
                                                        {new Date(
                                                            assignment.deadline
                                                        ).toLocaleString()}
                                                    </p>

                                                    <div className="mt-5 flex gap-3">

                                                        <button
                                                            onClick={() =>
                                                                handleEditAssignment(
                                                                    assignment
                                                                )
                                                            }
                                                            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                handleDeleteAssignment(
                                                                    assignment._id
                                                                )
                                                            }
                                                            className="rounded-lg border border-red-900 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950/40"
                                                        >
                                                            Delete
                                                        </button>

                                                    </div>

                                                </div>

                                            )
                                        )}

                                    </div>

                                )}

                            </div>

                        </div>
                    )}

                    {activeSection === "profile" && (
                        <div className="mx-auto max-w-5xl space-y-8 pb-10">
                            {/* Header */}
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-white">
                                    Recruiter Profile
                                </h1>
                                <p className="mt-2 text-sm text-slate-400">
                                    Manage your professional information and company details.
                                </p>
                            </div>

                            {/* Messages */}
                            {profileMessage && (
                                <div
                                    role="status"
                                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
                                >
                                    {profileMessage}
                                </div>
                            )}

                            {profileError && (
                                <div
                                    role="alert"
                                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                                >
                                    {profileError}
                                </div>
                            )}

                            {profileLoading ? (
                                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-10 text-center text-slate-300">
                                    Loading recruiter profile...
                                </div>
                            ) : (
                                <form onSubmit={handleSaveRecruiterProfile} className="space-y-8">
                                    {/* Personal Information */}
                                    <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl sm:p-8">
                                        <div className="mb-6">
                                            <h2 className="text-xl font-semibold text-white">
                                                Personal Information
                                            </h2>
                                            <p className="mt-1 text-sm text-slate-400">
                                                Your contact and professional details.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                            <div>
                                                <label
                                                    htmlFor="firstName"
                                                    className="mb-2 block text-sm font-medium text-slate-300"
                                                >
                                                    First Name
                                                </label>
                                                <input
                                                    id="firstName"
                                                    type="text"
                                                    value={recruiterProfile.firstName}
                                                    onChange={(e) =>
                                                        setRecruiterProfile({
                                                            ...recruiterProfile,
                                                            firstName: e.target.value,
                                                        })
                                                    }
                                                    placeholder="Enter first name"
                                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="lastName"
                                                    className="mb-2 block text-sm font-medium text-slate-300"
                                                >
                                                    Last Name
                                                </label>
                                                <input
                                                    id="lastName"
                                                    type="text"
                                                    value={recruiterProfile.lastName}
                                                    onChange={(e) =>
                                                        setRecruiterProfile({
                                                            ...recruiterProfile,
                                                            lastName: e.target.value,
                                                        })
                                                    }
                                                    placeholder="Enter last name"
                                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="email"
                                                    className="mb-2 block text-sm font-medium text-slate-300"
                                                >
                                                    Email Address
                                                </label>
                                                <input
                                                    id="email"
                                                    type="email"
                                                    value={recruiterProfile.email}
                                                    onChange={(e) =>
                                                        setRecruiterProfile({
                                                            ...recruiterProfile,
                                                            email: e.target.value,
                                                        })
                                                    }
                                                    placeholder="Enter email address"
                                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="phone"
                                                    className="mb-2 block text-sm font-medium text-slate-300"
                                                >
                                                    Phone Number
                                                </label>
                                                <input
                                                    id="phone"
                                                    type="tel"
                                                    value={recruiterProfile.phone}
                                                    onChange={(e) =>
                                                        setRecruiterProfile({
                                                            ...recruiterProfile,
                                                            phone: e.target.value,
                                                        })
                                                    }
                                                    placeholder="Enter phone number"
                                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="designation"
                                                    className="mb-2 block text-sm font-medium text-slate-300"
                                                >
                                                    Job Designation
                                                </label>
                                                <input
                                                    id="designation"
                                                    type="text"
                                                    value={recruiterProfile.designation}
                                                    onChange={(e) =>
                                                        setRecruiterProfile({
                                                            ...recruiterProfile,
                                                            designation: e.target.value,
                                                        })
                                                    }
                                                    placeholder="e.g. Technical Recruiter"
                                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="location"
                                                    className="mb-2 block text-sm font-medium text-slate-300"
                                                >
                                                    Location
                                                </label>
                                                <input
                                                    id="location"
                                                    type="text"
                                                    value={recruiterProfile.location}
                                                    onChange={(e) =>
                                                        setRecruiterProfile({
                                                            ...recruiterProfile,
                                                            location: e.target.value,
                                                        })
                                                    }
                                                    placeholder="e.g. Bengaluru, India"
                                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    {/* Company Information */}
                                    <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl sm:p-8">
                                        <div className="mb-6">
                                            <h2 className="text-xl font-semibold text-white">
                                                Company Information
                                            </h2>
                                            <p className="mt-1 text-sm text-slate-400">
                                                Tell candidates about your organization.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                            <div>
                                                <label
                                                    htmlFor="companyName"
                                                    className="mb-2 block text-sm font-medium text-slate-300"
                                                >
                                                    Company Name
                                                </label>
                                                <input
                                                    id="companyName"
                                                    type="text"
                                                    value={recruiterProfile.companyName}
                                                    onChange={(e) =>
                                                        setRecruiterProfile({
                                                            ...recruiterProfile,
                                                            companyName: e.target.value,
                                                        })
                                                    }
                                                    placeholder="Enter company name"
                                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="companyWebsite"
                                                    className="mb-2 block text-sm font-medium text-slate-300"
                                                >
                                                    Company Website
                                                </label>
                                                <input
                                                    id="companyWebsite"
                                                    type="url"
                                                    value={recruiterProfile.companyWebsite}
                                                    onChange={(e) =>
                                                        setRecruiterProfile({
                                                            ...recruiterProfile,
                                                            companyWebsite: e.target.value,
                                                        })
                                                    }
                                                    placeholder="https://example.com"
                                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="companyIndustry"
                                                    className="mb-2 block text-sm font-medium text-slate-300"
                                                >
                                                    Industry
                                                </label>
                                                <select
                                                    id="companyIndustry"
                                                    value={recruiterProfile.companyIndustry}
                                                    onChange={(e) =>
                                                        setRecruiterProfile({
                                                            ...recruiterProfile,
                                                            companyIndustry: e.target.value,
                                                        })
                                                    }
                                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                                >
                                                    <option value="">Select industry</option>
                                                    <option value="Information Technology">Information Technology</option>
                                                    <option value="Software Development">Software Development</option>
                                                    <option value="Healthcare">Healthcare</option>
                                                    <option value="Finance">Finance</option>
                                                    <option value="Education">Education</option>
                                                    <option value="Manufacturing">Manufacturing</option>
                                                    <option value="Consulting">Consulting</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="companySize"
                                                    className="mb-2 block text-sm font-medium text-slate-300"
                                                >
                                                    Company Size
                                                </label>
                                                <select
                                                    id="companySize"
                                                    value={recruiterProfile.companySize}
                                                    onChange={(e) =>
                                                        setRecruiterProfile({
                                                            ...recruiterProfile,
                                                            companySize: e.target.value,
                                                        })
                                                    }
                                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                                >
                                                    <option value="">Select company size</option>
                                                    <option value="1-10">1–10 employees</option>
                                                    <option value="11-50">11–50 employees</option>
                                                    <option value="51-200">51–200 employees</option>
                                                    <option value="201-500">201–500 employees</option>
                                                    <option value="501-1000">501–1000 employees</option>
                                                    <option value="1000+">1000+ employees</option>
                                                </select>
                                            </div>

                                            <div className="sm:col-span-2">
                                                <label
                                                    htmlFor="companyDescription"
                                                    className="mb-2 block text-sm font-medium text-slate-300"
                                                >
                                                    About the Company
                                                </label>
                                                <textarea
                                                    id="companyDescription"
                                                    rows={4}
                                                    value={recruiterProfile.companyDescription}
                                                    onChange={(e) =>
                                                        setRecruiterProfile({
                                                            ...recruiterProfile,
                                                            companyDescription: e.target.value,
                                                        })
                                                    }
                                                    placeholder="Describe your company, its mission, and what makes it a great place to work..."
                                                    className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    {/* Professional Links */}
                                    <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl sm:p-8">
                                        <div className="mb-6">
                                            <h2 className="text-xl font-semibold text-white">
                                                Professional Links
                                            </h2>
                                            <p className="mt-1 text-sm text-slate-400">
                                                Add links candidates can use to learn more about you.
                                            </p>
                                        </div>

                                        <div className="space-y-5">
                                            <div>
                                                <label
                                                    htmlFor="linkedinUrl"
                                                    className="mb-2 block text-sm font-medium text-slate-300"
                                                >
                                                    LinkedIn URL
                                                </label>
                                                <input
                                                    id="linkedinUrl"
                                                    type="url"
                                                    value={recruiterProfile.linkedinUrl}
                                                    onChange={(e) =>
                                                        setRecruiterProfile({
                                                            ...recruiterProfile,
                                                            linkedinUrl: e.target.value,
                                                        })
                                                    }
                                                    placeholder="https://linkedin.com/in/your-profile"
                                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="githubUrl"
                                                    className="mb-2 block text-sm font-medium text-slate-300"
                                                >
                                                    GitHub URL
                                                </label>
                                                <input
                                                    id="githubUrl"
                                                    type="url"
                                                    value={recruiterProfile.githubUrl}
                                                    onChange={(e) =>
                                                        setRecruiterProfile({
                                                            ...recruiterProfile,
                                                            githubUrl: e.target.value,
                                                        })
                                                    }
                                                    placeholder="https://github.com/your-username"
                                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="portfolioUrl"
                                                    className="mb-2 block text-sm font-medium text-slate-300"
                                                >
                                                    Portfolio URL
                                                </label>
                                                <input
                                                    id="portfolioUrl"
                                                    type="url"
                                                    value={recruiterProfile.portfolioUrl}
                                                    onChange={(e) =>
                                                        setRecruiterProfile({
                                                            ...recruiterProfile,
                                                            portfolioUrl: e.target.value,
                                                        })
                                                    }
                                                    placeholder="https://yourportfolio.com"
                                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    {/* Save Button */}
                                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                        <button
                                            type="button"
                                            onClick={fetchRecruiterProfile}
                                            disabled={profileSaving || profileLoading}
                                            className="rounded-xl border border-slate-700 px-6 py-3 font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Reset Changes
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={profileSaving || profileLoading}
                                            className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {profileSaving ? "Saving Profile..." : "Save Profile"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}


                    {selectedJobForApplicants && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl sm:p-7">
                                <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
                                    <div>
                                        <h2 className="text-xl font-bold text-white sm:text-2xl">
                                            Applicants
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-400">
                                            {selectedJobForApplicants.title}
                                        </p>
                                    </div>

                                    <button
                                        onClick={closeApplicants}
                                        className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {loadingApplicants ? (
                                    <div className="py-12 text-center text-slate-400">
                                        Loading applicants...
                                    </div>
                                ) : applicantError ? (
                                    <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                        {applicantError}
                                    </div>
                                ) : applicants.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <p className="text-lg font-medium text-slate-300">
                                            No applicants yet.
                                        </p>
                                        <p className="mt-2 text-sm text-slate-500">
                                            Students who apply for this job will appear here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mt-6 space-y-5">
                                        {applicants.map((application) => {
                                            const student = application.student;

                                            return (
                                                <div
                                                    key={application._id}
                                                    className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                                                >
                                                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-white">
                                                                {student?.firstName || ""}{" "}
                                                                {student?.lastName || ""}
                                                            </h3>
                                                            <p className="mt-1 text-sm text-slate-400">
                                                                {student?.email || "No email available"}
                                                            </p>
                                                            {student?.college && (
                                                                <p className="mt-1 text-sm text-slate-500">
                                                                    {student.college}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <span
                                                            className={`rounded-full px-3 py-1 text-xs font-medium ${application.status === "selected"
                                                                ? "bg-emerald-500/10 text-emerald-400"
                                                                : application.status === "shortlisted"
                                                                    ? "bg-blue-500/10 text-blue-400"
                                                                    : application.status === "rejected"
                                                                        ? "bg-red-500/10 text-red-400"
                                                                        : application.status === "withdrawn"
                                                                            ? "bg-slate-500/10 text-slate-400"
                                                                            : "bg-yellow-500/10 text-yellow-400"
                                                                }`}
                                                        >
                                                            {application.status}
                                                        </span>
                                                    </div>

                                                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                                        <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                                                            <p className="text-xs text-slate-500">
                                                                Applied On
                                                            </p>
                                                            <p className="mt-1 text-sm font-medium text-slate-300">
                                                                {application.appliedAt
                                                                    ? new Date(application.appliedAt).toLocaleDateString()
                                                                    : "N/A"}
                                                            </p>
                                                        </div>

                                                        <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                                                            <p className="text-xs text-slate-500">
                                                                Skills
                                                            </p>
                                                            <p className="mt-1 text-sm font-medium text-slate-300">
                                                                {student?.skills?.length || 0}
                                                            </p>
                                                        </div>

                                                        <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                                                            <p className="text-xs text-slate-500">
                                                                Resume
                                                            </p>

                                                            {(application.resume?.url || student?.resume?.url) ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const resumeUrl =
                                                                            application.resume?.url || student?.resume?.url;

                                                                        const resumeName =
                                                                            application.resume?.fileName ||
                                                                            student?.resume?.fileName ||
                                                                            "Resume";

                                                                        setSelectedResumeUrl(resumeUrl);
                                                                        setSelectedResumeName(resumeName);
                                                                        setSelectedResumeResourceType(
                                                                            application.resume?.resourceType || student?.resume?.resourceType || "raw"
                                                                        );
                                                                        setViewingResume(true);
                                                                    }}
                                                                    className="mt-1 inline-block text-sm font-medium text-blue-400 hover:text-blue-300"
                                                                >
                                                                    View Resume →
                                                                </button>
                                                            ) : (
                                                                <p className="mt-1 text-sm text-slate-500">
                                                                    Not uploaded
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {student?.skills?.length > 0 && (
                                                        <div className="mt-5">
                                                            <p className="text-sm font-medium text-slate-300">
                                                                Skills
                                                            </p>
                                                            <div className="mt-2 flex flex-wrap gap-2">
                                                                {student.skills.map((skill) => (
                                                                    <span
                                                                        key={skill._id || skill.name}
                                                                        className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
                                                                    >
                                                                        {skill.name}
                                                                        {skill.level && (
                                                                            <span className="ml-2 text-slate-500">
                                                                                {skill.level}
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="mt-5">
                                                        <p className="text-sm font-medium text-slate-300">
                                                            Cover Letter
                                                        </p>
                                                        <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950 p-4">
                                                            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-400">
                                                                {application.coverLetter ||
                                                                    "No cover letter provided."}
                                                            </p>
                                                        </div>
                                                        {/* AI Candidate Evaluation */}
                                                        <div className="mt-6 rounded-xl border border-purple-500/30 bg-purple-500/5 p-5">

                                                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                                                <div>
                                                                    <h4 className="text-base font-semibold text-white">
                                                                        🤖 AI Candidate Evaluation
                                                                    </h4>

                                                                    <p className="mt-1 text-sm text-slate-400">
                                                                        Compare this candidate's skills and projects with the job requirements.
                                                                    </p>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleEvaluateCandidate(application)}
                                                                    disabled={evaluatingApplicationId === application._id}
                                                                    className="shrink-0 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    {evaluatingApplicationId === application._id
                                                                        ? "Analyzing..."
                                                                        : candidateEvaluations[application._id]
                                                                            ? "Re-evaluate Candidate"
                                                                            : "Evaluate with AI"}
                                                                </button>
                                                            </div>

                                                            {evaluationErrors[application._id] && (
                                                                <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                                                                    {evaluationErrors[application._id]}
                                                                </div>
                                                            )}

                                                            {candidateEvaluations[application._id] && (() => {
                                                                const evaluation = candidateEvaluations[application._id];

                                                                return (
                                                                    <div className="mt-6 space-y-5 border-t border-slate-800 pt-5">

                                                                        {/* Scores */}
                                                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                                                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                                                                                <p className="text-sm text-slate-400">
                                                                                    Required Skill Match
                                                                                </p>

                                                                                <p className="mt-2 text-3xl font-bold text-blue-400">
                                                                                    {evaluation.skillMatchScore == null
                                                                                        ? "N/A"
                                                                                        : `${evaluation.skillMatchScore}%`}
                                                                                </p>

                                                                                <p className="mt-1 text-xs text-slate-500">
                                                                                    Based on matching listed skills
                                                                                </p>
                                                                            </div>

                                                                            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                                                                                <p className="text-sm text-slate-400">
                                                                                    AI Evaluation Score
                                                                                </p>

                                                                                <p className="mt-2 text-3xl font-bold text-purple-400">
                                                                                    {evaluation.evaluationScore}/100
                                                                                </p>

                                                                                <p className="mt-1 text-xs text-slate-500">
                                                                                    AI-generated assessment, not a hiring decision
                                                                                </p>
                                                                            </div>

                                                                        </div>

                                                                        {/* Summary */}
                                                                        <div>
                                                                            <h5 className="font-semibold text-white">
                                                                                Evaluation Summary
                                                                            </h5>

                                                                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                                                                                {evaluation.summary}
                                                                            </p>
                                                                        </div>

                                                                        {/* Matched Skills */}
                                                                        <div>
                                                                            <h5 className="font-semibold text-white">
                                                                                Matched Skills
                                                                            </h5>

                                                                            {evaluation.matchedSkills?.length > 0 ? (
                                                                                <div className="mt-2 flex flex-wrap gap-2">
                                                                                    {evaluation.matchedSkills.map((skill, index) => (
                                                                                        <span
                                                                                            key={`${skill}-${index}`}
                                                                                            className="rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400"
                                                                                        >
                                                                                            ✓ {skill}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            ) : (
                                                                                <p className="mt-2 text-sm text-slate-500">
                                                                                    No matching skills identified.
                                                                                </p>
                                                                            )}
                                                                        </div>

                                                                        {/* Missing Skills */}
                                                                        <div>
                                                                            <h5 className="font-semibold text-white">
                                                                                Skill Gaps
                                                                            </h5>

                                                                            {evaluation.missingSkills?.length > 0 && (
                                                                                <div className="mt-2 flex flex-wrap gap-2">
                                                                                    {evaluation.missingSkills.map((skill, index) => (
                                                                                        <span
                                                                                            key={`${skill}-${index}`}
                                                                                            className="rounded-md bg-yellow-500/10 px-3 py-1.5 text-xs text-yellow-400"
                                                                                        >
                                                                                            {skill}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            )}

                                                                            {evaluation.skillGaps?.length > 0 && (
                                                                                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-400">
                                                                                    {evaluation.skillGaps.map((gap, index) => (
                                                                                        <li key={index}>{gap}</li>
                                                                                    ))}
                                                                                </ul>
                                                                            )}
                                                                        </div>

                                                                        {/* Strengths */}
                                                                        <div>
                                                                            <h5 className="font-semibold text-white">
                                                                                Candidate Strengths
                                                                            </h5>

                                                                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-400">
                                                                                {(evaluation.strengths || []).map((strength, index) => (
                                                                                    <li key={index}>{strength}</li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>

                                                                        {/* Relevant Projects */}
                                                                        <div>
                                                                            <h5 className="font-semibold text-white">
                                                                                Relevant Projects
                                                                            </h5>

                                                                            {evaluation.relevantProjects?.length > 0 ? (
                                                                                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-400">
                                                                                    {evaluation.relevantProjects.map((project, index) => (
                                                                                        <li key={index}>{project}</li>
                                                                                    ))}
                                                                                </ul>
                                                                            ) : (
                                                                                <p className="mt-2 text-sm text-slate-500">
                                                                                    No particularly relevant projects identified.
                                                                                </p>
                                                                            )}
                                                                        </div>

                                                                        {/* Interview Questions */}
                                                                        <div>
                                                                            <h5 className="font-semibold text-white">
                                                                                Suggested Interview Questions
                                                                            </h5>

                                                                            <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-400">
                                                                                {(evaluation.interviewQuestions || []).map(
                                                                                    (question, index) => (
                                                                                        <li key={index}>{question}</li>
                                                                                    )
                                                                                )}
                                                                            </ol>
                                                                        </div>

                                                                    </div>
                                                                );
                                                            })()}

                                                        </div>
                                                        {/* Applicant Actions */}
                                                        <div className="mt-5 flex justify-end gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleShortlistApplicant(application)}
                                                                disabled={
                                                                    application.status === "shortlisted" ||
                                                                    application.status === "selected" ||
                                                                    application.status === "rejected"
                                                                }
                                                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${application.status === "shortlisted"
                                                                    ? "bg-blue-500/10 text-blue-400 cursor-not-allowed"
                                                                    : application.status === "selected" ||
                                                                        application.status === "rejected"
                                                                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                                                        : "bg-blue-600 text-white hover:bg-blue-500"
                                                                    }`}
                                                            >
                                                                {application.status === "shortlisted"
                                                                    ? "✓ Shortlisted"
                                                                    : application.status === "selected"
                                                                        ? "Selected"
                                                                        : application.status === "rejected"
                                                                            ? "Rejected"
                                                                            : "Shortlist"}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {student?.bio && (
                                                        <div className="mt-5">
                                                            <p className="text-sm font-medium text-slate-300">
                                                                About
                                                            </p>
                                                            <p className="mt-2 text-sm leading-6 text-slate-400">
                                                                {student.bio}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="mt-6 flex justify-end border-t border-slate-800 pt-5">
                                    <button
                                        onClick={closeApplicants}
                                        className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </main>

            </div >

            {viewingResume && selectedResumeUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6">

                    <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-950">

                        {/* Header */}
                        <div className="flex items-center justify-between gap-4 border-b border-slate-800 p-4">

                            <div className="min-w-0">

                                <h2 className="truncate text-base font-semibold text-white sm:text-lg">
                                    {selectedResumeName}
                                </h2>

                                <p className="mt-1 text-xs text-slate-400">
                                    Resume Preview
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setViewingResume(false);
                                    setSelectedResumeUrl("");
                                    setSelectedResumeName("");
                                }}
                                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                            >
                                Close
                            </button>

                        </div>

                        {/* PDF Preview */}
                        {/* Resume Preview */}
                        <div className="flex-1 overflow-auto bg-slate-200 p-6">
                            <iframe
                                src={selectedResumeUrl}
                                title="Resume Preview"
                                className="h-full w-full border-0"
                            />
                        </div>

                    </div>

                </div>
            )}

        </div >
    );
}

export default RecruiterDashboard;
