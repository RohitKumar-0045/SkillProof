import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import GitHubConnection from "./GitHubConnection.jsx";
const API_URL = import.meta.env.VITE_API_URL;

function MyProfile() {
    const { getToken } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");

    const [bio, setBio] = useState("");
    const [college, setCollege] = useState("");
    const [degree, setDegree] = useState("");
    const [branch, setBranch] = useState("");
    const [graduationYear, setGraduationYear] = useState("");
    const [location, setLocation] = useState("");

    const [linkedinUrl, setLinkedinUrl] = useState("");
    const [githubUrl, setGithubUrl] = useState("");
    const [portfolioUrl, setPortfolioUrl] = useState("");

    const [resume, setResume] = useState(null);
    const [selectedResume, setSelectedResume] = useState(null);

    const [uploadingResume, setUploadingResume] = useState(false);
    const [deletingResume, setDeletingResume] = useState(false);

    const [profileMessage, setProfileMessage] = useState("");
    const [resumeMessage, setResumeMessage] = useState("");
    const [resumeAnalysis, setResumeAnalysis] = useState(null);

    const [viewingResume, setViewingResume] = useState(false);
    const [resumePreviewUrl, setResumePreviewUrl] = useState("");
    const [loadingResumePreview, setLoadingResumePreview] = useState(false);

    useEffect(() => () => {
        if (resumePreviewUrl) URL.revokeObjectURL(resumePreviewUrl);
    }, [resumePreviewUrl]);

    const handleViewResume = async () => {
        try {
            setLoadingResumePreview(true);
            setResumeMessage("");
            const token = await getToken();
            const response = await fetch(
                `${API_URL}/api/users/resume/preview`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to load resume preview");
            }
            setResumePreviewUrl(URL.createObjectURL(await response.blob()));
            setViewingResume(true);
        } catch (error) {
            setResumeMessage(error.message);
        } finally {
            setLoadingResumePreview(false);
        }
    };

    const fetchProfile = async () => {
        try {
            setLoading(true);

            const token = await getToken();

            const response = await fetch(
                `${API_URL}/api/users/me`,
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
                    data.message || "Failed to load profile"
                );
            }

            const currentUser = data.user;

            setFirstName(currentUser.firstName || "");
            setLastName(currentUser.lastName || "");
            setEmail(currentUser.email || "");

            setBio(currentUser.bio || "");
            setCollege(currentUser.college || "");
            setDegree(currentUser.degree || "");
            setBranch(currentUser.branch || "");

            setGraduationYear(
                currentUser.graduationYear || ""
            );

            setLocation(currentUser.location || "");

            setLinkedinUrl(
                currentUser.linkedinUrl || ""
            );

            setGithubUrl(
                currentUser.githubUrl || ""
            );

            setPortfolioUrl(
                currentUser.portfolioUrl || ""
            );

            if (currentUser.resume?.url) {
                setResume(currentUser.resume);
            } else {
                setResume(null);
            }

            setResumeAnalysis(
                currentUser.resumeAnalysis?.analyzedAt
                    ? currentUser.resumeAnalysis
                    : null
            );

        } catch (error) {
            console.error(
                "Failed to load profile:",
                error.message
            );

            setProfileMessage(error.message);

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSaveProfile = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setProfileMessage("");

            const token = await getToken();

            const response = await fetch(
                `${API_URL}/api/users/profile`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        firstName,
                        lastName,
                        email,
                        bio,
                        college,
                        degree,
                        branch,
                        graduationYear:
                            graduationYear === ""
                                ? null
                                : Number(graduationYear),
                        location,
                        linkedinUrl,
                        githubUrl,
                        portfolioUrl
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to update profile"
                );
            }

            const updatedUser = data.user;

            setFirstName(updatedUser.firstName || "");
            setLastName(updatedUser.lastName || "");
            setEmail(updatedUser.email || "");

            setBio(updatedUser.bio || "");
            setCollege(updatedUser.college || "");
            setDegree(updatedUser.degree || "");
            setBranch(updatedUser.branch || "");

            setGraduationYear(
                updatedUser.graduationYear || ""
            );

            setLocation(updatedUser.location || "");

            setLinkedinUrl(
                updatedUser.linkedinUrl || ""
            );

            setGithubUrl(
                updatedUser.githubUrl || ""
            );

            setPortfolioUrl(
                updatedUser.portfolioUrl || ""
            );

            setProfileMessage(
                "Profile updated successfully"
            );

        } catch (error) {
            console.error(
                "Profile update failed:",
                error.message
            );

            setProfileMessage(
                error.message
            );

        } finally {
            setSaving(false);
        }
    };

    const handleResumeChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        if (file.type !== "application/pdf") {
            setSelectedResume(null);

            setResumeMessage(
                "Only PDF files are allowed"
            );

            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setSelectedResume(null);

            setResumeMessage(
                "Resume must be smaller than 5 MB"
            );

            return;
        }

        setSelectedResume(file);
        setResumeMessage("");
    };

    const handleUploadResume = async () => {
        if (!selectedResume) {
            setResumeMessage(
                "Please select a PDF resume first"
            );
            return;
        }

        try {
            setUploadingResume(true);
            setResumeMessage("");
            setResumeAnalysis(null);

            const token = await getToken();

            const formData = new FormData();

            formData.append(
                "resume",
                selectedResume
            );

            const response = await fetch(
                `${API_URL}/api/users/resume`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to upload resume"
                );
            }

            setResume(data.resume);
            setSelectedResume(null);

            if (
                data.analysisStatus === "completed" &&
                data.analysis
            ) {
                setResumeAnalysis(data.analysis);

                setResumeMessage(
                    "Resume uploaded and AI analysis completed successfully!"
                );
            } else {
                setResumeAnalysis(null);

                setResumeMessage(
                    data.analysisMessage ||
                    "Resume uploaded, but AI analysis could not be completed."
                );
            }

        } catch (error) {
            console.error(
                "Resume upload failed:",
                error.message
            );

            setResumeMessage(
                error.message ||
                "Failed to upload resume"
            );

        } finally {
            setUploadingResume(false);
        }
    };

    const handleDeleteResume = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to delete your resume?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingResume(true);
            setResumeMessage("");

            const token = await getToken();

            const response = await fetch(
                `${API_URL}/api/users/resume`,
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
                    "Failed to delete resume"
                );
            }

            setResume(null);
            setSelectedResume(null);
            setViewingResume(false);

            setResumeMessage(
                "Resume deleted successfully"
            );

        } catch (error) {
            console.error(
                "Resume delete failed:",
                error.message
            );

            setResumeMessage(
                error.message
            );

        } finally {
            setDeletingResume(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-300px items-center justify-center px-4 text-center text-slate-400">
                Loading profile...
            </div>
        );
    }

    return (
        <div className="w-full pb-10">

            <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                    My Profile
                </h1>

                <p className="mt-2 text-sm text-slate-400 sm:text-base">
                    Build and manage your professional identity.
                </p>
            </div>

            <form
                onSubmit={handleSaveProfile}
                className="mt-6 w-full max-w-4xl sm:mt-8"
            >

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-6">

                    <h2 className="text-lg font-semibold text-white sm:text-xl">
                        Basic Information
                    </h2>

                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">

                        <div>
                            <label className="text-sm text-slate-300">
                                First Name
                            </label>

                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) =>
                                    setFirstName(e.target.value)
                                }
                                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-slate-300">
                                Last Name
                            </label>

                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) =>
                                    setLastName(e.target.value)
                                }
                                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-sm text-slate-300">
                                Email
                            </label>

                            <input
                                type="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                            />
                        </div>

                    </div>

                </div>

                <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-6">

                    <h2 className="text-lg font-semibold text-white sm:text-xl">
                        Profile Information
                    </h2>

                    <div className="mt-5 space-y-5">

                        <div>
                            <label className="text-sm text-slate-300">
                                Bio
                            </label>

                            <textarea
                                value={bio}
                                onChange={(e) =>
                                    setBio(e.target.value)
                                }
                                rows="4"
                                placeholder="Tell recruiters about yourself..."
                                className="mt-2 w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                            <div>
                                <label className="text-sm text-slate-300">
                                    College
                                </label>

                                <input
                                    type="text"
                                    value={college}
                                    onChange={(e) =>
                                        setCollege(e.target.value)
                                    }
                                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-slate-300">
                                    Degree
                                </label>

                                <input
                                    type="text"
                                    value={degree}
                                    onChange={(e) =>
                                        setDegree(e.target.value)
                                    }
                                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-slate-300">
                                    Branch
                                </label>

                                <input
                                    type="text"
                                    value={branch}
                                    onChange={(e) =>
                                        setBranch(e.target.value)
                                    }
                                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-slate-300">
                                    Graduation Year
                                </label>

                                <input
                                    type="number"
                                    value={graduationYear}
                                    onChange={(e) =>
                                        setGraduationYear(e.target.value)
                                    }
                                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-sm text-slate-300">
                                    Location
                                </label>

                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) =>
                                        setLocation(e.target.value)
                                    }
                                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                                />
                            </div>

                        </div>

                    </div>

                </div>

                <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-6">

                    <h2 className="text-lg font-semibold text-white sm:text-xl">
                        Professional Links
                    </h2>

                    <div className="mt-5 space-y-4">

                        <div>
                            <label className="text-sm text-slate-300">
                                LinkedIn URL
                            </label>

                            <input
                                type="url"
                                value={linkedinUrl}
                                onChange={(e) =>
                                    setLinkedinUrl(e.target.value)
                                }
                                placeholder="https://linkedin.com/in/..."
                                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-slate-300">
                                GitHub URL
                            </label>

                            <input
                                type="url"
                                value={githubUrl}
                                onChange={(e) =>
                                    setGithubUrl(e.target.value)
                                }
                                placeholder="https://github.com/..."
                                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-slate-300">
                                Portfolio URL
                            </label>

                            <input
                                type="url"
                                value={portfolioUrl}
                                onChange={(e) =>
                                    setPortfolioUrl(e.target.value)
                                }
                                placeholder="https://yourportfolio.com"
                                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                            />
                        </div>

                    </div>

                    {profileMessage && (
                        <p className="mt-4 text-sm text-slate-300">
                            {profileMessage}
                        </p>
                    )}

                    <div className="mt-6">

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            {saving
                                ? "Saving..."
                                : "Save Profile"}
                        </button>

                    </div>

                </div>

            </form>

            <div className="mt-8 w-full max-w-4xl rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-6">

                <div>
                    <h2 className="text-xl font-semibold text-white">
                        Resume
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                        Upload your latest resume in PDF format.
                    </p>
                </div>

                {resume?.url ? (

                    <div className="mt-6 rounded-lg border border-slate-700 bg-slate-900 p-4 sm:p-5">

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                            <div className="min-w-0">

                                <p className="text-sm text-slate-400">
                                    Current Resume
                                </p>

                                <p className="mt-1 truncate font-medium text-white">
                                    📄 {resume.fileName}
                                </p>

                            </div>

                            <div className="flex flex-wrap gap-3">

                                <button
                                    type="button"
                                    onClick={handleViewResume}
                                    disabled={loadingResumePreview}
                                    className="rounded-lg border border-blue-500/40 px-4 py-2 text-sm font-medium text-blue-400 transition hover:bg-blue-500/10"
                                >
                                    {loadingResumePreview ? "Loading Preview..." : "View Resume"}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDeleteResume}
                                    disabled={deletingResume}
                                    className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {deletingResume
                                        ? "Deleting..."
                                        : "Delete"}
                                </button>

                            </div>

                        </div>

                    </div>

                ) : (

                    <div className="mt-6 rounded-lg border border-dashed border-slate-700 p-6 text-center">

                        <div className="text-4xl">
                            📄
                        </div>

                        <p className="mt-3 font-medium text-white">
                            No resume uploaded yet
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                            Upload a PDF resume up to 5 MB.
                        </p>

                    </div>

                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">

                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleResumeChange}
                        className="w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-slate-700 sm:flex-1"
                    />

                    <button
                        type="button"
                        onClick={handleUploadResume}
                        disabled={
                            !selectedResume ||
                            uploadingResume
                        }
                        className="w-full rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                        {uploadingResume
                            ? "Uploading..."
                            : resume
                                ? "Replace Resume"
                                : "Upload Resume"}
                    </button>

                </div>

                {selectedResume && (
                    <p className="mt-3 text-sm text-slate-300">
                        Selected: {selectedResume.name}
                    </p>
                )}

                {resumeMessage && (
                    <p className="mt-4 text-sm text-slate-300">
                        {resumeMessage}
                    </p>
                )}

            </div>

            {/* AI Resume Analysis */}
            {resume?.url && (
                <div className="mt-6 w-full max-w-4xl rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-6">

                    <div>
                        <h2 className="text-xl font-semibold text-white">
                            🤖 AI Resume Analyzer
                        </h2>

                        <p className="mt-2 text-sm text-slate-400">
                            AI-powered feedback to help improve your resume.
                        </p>
                    </div>

                    {uploadingResume ? (
                        <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-6 text-center">
                            <p className="font-medium text-white">
                                Analyzing your resume...
                            </p>

                            <p className="mt-2 text-sm text-slate-400">
                                Extracting resume text and evaluating it with AI.
                            </p>
                        </div>
                    ) : resumeAnalysis ? (
                        <div className="mt-6 space-y-6">

                            {/* Overall Score */}
                            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">
                                <p className="text-sm font-medium text-blue-300">
                                    Overall Resume Score
                                </p>

                                <div className="mt-2 flex items-end gap-2">
                                    <span className="text-5xl font-bold text-white">
                                        {resumeAnalysis.overallScore}
                                    </span>

                                    <span className="mb-1 text-lg text-slate-400">
                                        / 100
                                    </span>
                                </div>

                                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-800">
                                    <div
                                        className="h-full rounded-full bg-blue-500 transition-all"
                                        style={{
                                            width: `${resumeAnalysis.overallScore}%`
                                        }}
                                    />
                                </div>

                                {resumeAnalysis.summary && (
                                    <p className="mt-4 text-sm leading-6 text-slate-300">
                                        {resumeAnalysis.summary}
                                    </p>
                                )}
                            </div>

                            {/* Category Scores */}
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    Category Scores
                                </h3>

                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {[
                                        ["Technical Skills", "skills"],
                                        ["Projects", "projects"],
                                        ["Education", "education"],
                                        ["Experience", "experience"],
                                        ["Formatting & Readability", "formatting"]
                                    ].map(([label, key]) => {
                                        const score =
                                            resumeAnalysis.categoryScores?.[key];

                                        return (
                                            <div
                                                key={key}
                                                className="rounded-lg border border-slate-800 bg-slate-900 p-4"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="text-sm text-slate-300">
                                                        {label}
                                                    </span>

                                                    <span className="font-semibold text-white">
                                                        {typeof score === "number"
                                                            ? `${score}/100`
                                                            : "N/A"}
                                                    </span>
                                                </div>

                                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                                                    <div
                                                        className="h-full rounded-full bg-emerald-500"
                                                        style={{
                                                            width: `${typeof score === "number"
                                                                ? Math.max(0, Math.min(100, score))
                                                                : 0
                                                                }%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Strengths */}
                            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                                <h3 className="font-semibold text-emerald-400">
                                    ✅ Strengths
                                </h3>

                                {resumeAnalysis.strengths?.length ? (
                                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                                        {resumeAnalysis.strengths.map((item, index) => (
                                            <li key={index}>{item}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="mt-2 text-sm text-slate-400">
                                        No strengths available.
                                    </p>
                                )}
                            </div>

                            {/* Weaknesses */}
                            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                                <h3 className="font-semibold text-amber-400">
                                    ⚠️ Areas to Improve
                                </h3>

                                {resumeAnalysis.weaknesses?.length ? (
                                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                                        {resumeAnalysis.weaknesses.map((item, index) => (
                                            <li key={index}>{item}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="mt-2 text-sm text-slate-400">
                                        No weaknesses available.
                                    </p>
                                )}
                            </div>

                            {/* Suggestions */}
                            <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4">
                                <h3 className="font-semibold text-purple-400">
                                    💡 AI Recommendations
                                </h3>

                                {resumeAnalysis.suggestions?.length ? (
                                    <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-300">
                                        {resumeAnalysis.suggestions.map((item, index) => (
                                            <li key={index}>{item}</li>
                                        ))}
                                    </ol>
                                ) : (
                                    <p className="mt-2 text-sm text-slate-400">
                                        No suggestions available.
                                    </p>
                                )}
                            </div>

                            {resumeAnalysis.analyzedAt && (
                                <p className="text-xs text-slate-500">
                                    Last analyzed:{" "}
                                    {new Date(
                                        resumeAnalysis.analyzedAt
                                    ).toLocaleString()}
                                </p>
                            )}

                            <p className="text-xs leading-5 text-slate-500">
                                This is an AI-generated resume assessment, not an official ATS score or a guarantee of hiring outcomes.
                            </p>

                        </div>
                    ) : (
                        <div className="mt-6 rounded-lg border border-dashed border-slate-700 p-5 text-center">
                            <p className="font-medium text-white">
                                No analysis available yet
                            </p>

                            <p className="mt-2 text-sm text-slate-400">
                                Upload or replace your resume to generate a new analysis.
                            </p>
                        </div>
                    )}

                </div>
            )}
            {viewingResume && resumePreviewUrl && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6">

                    <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-950">

                        <div className="flex items-center justify-between gap-4 border-b border-slate-800 p-4">

                            <div className="min-w-0">

                                <h2 className="truncate text-base font-semibold text-white sm:text-lg">
                                    {resume.fileName}
                                </h2>

                                <p className="mt-1 text-xs text-slate-400">
                                    Resume Preview
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setViewingResume(false);
                                    setResumePreviewUrl("");
                                }}
                                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                            >
                                Close
                            </button>

                        </div>

                        <div className="flex-1 bg-white">

                            <iframe
                                src={resumePreviewUrl}
                                title="Resume Preview"
                                className="h-full w-full border-0"
                            />

                        </div>

                    </div>

                </div>

            )}

            <GitHubConnection />
        </div>
    );
}

export default MyProfile;
