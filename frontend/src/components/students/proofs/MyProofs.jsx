import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";

function MyProofs() {
    const { getToken } = useAuth();

    const [skills, setSkills] = useState([]);
    const [projects, setProjects] = useState([]);
    const [evidence, setEvidence] = useState([]);

    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);

    const [selectedSkill, setSelectedSkill] = useState("");
    const [selectedProject, setSelectedProject] = useState("");

    const [analyzingId, setAnalyzingId] = useState(null);

    const loadData = async () => {
        try {
            setLoading(true);

            const token = await getToken();

            const [userResponse, projectsResponse, evidenceResponse] =
                await Promise.all([
                    fetch("http://localhost:5000/api/users/me", {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }),

                    fetch("http://localhost:5000/api/projects", {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }),

                    fetch("http://localhost:5000/api/evidence", {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    })
                ]);

            const userData = await userResponse.json();
            const projectsData = await projectsResponse.json();
            const evidenceData = await evidenceResponse.json();

            if (!userResponse.ok) {
                throw new Error(
                    userData.message || "Failed to load skills"
                );
            }

            if (!projectsResponse.ok) {
                throw new Error(
                    projectsData.message || "Failed to load projects"
                );
            }

            if (!evidenceResponse.ok) {
                throw new Error(
                    evidenceData.message || "Failed to load evidence"
                );
            }

            setSkills(userData.user.skills || []);
            setProjects(projectsData.projects || []);
            setEvidence(evidenceData.evidence || []);

        } catch (error) {
            console.error(
                "Failed to load proof data:",
                error.message
            );

            toast.error(error.message);

        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadData();
    }, []);


    const handleCreateEvidence = async (e) => {
        e.preventDefault();

        if (!selectedSkill || !selectedProject) {
            toast.error("Please select a skill and project");
            return;
        }

        const project = projects.find(
            (item) => item._id === selectedProject
        );

        if (!project) {
            toast.error("Project not found");
            return;
        }

        if (!project.githubRepo?.id) {
            toast.error(
                "This project does not have a linked GitHub repository"
            );
            return;
        }

        try {
            setCreating(true);

            const token = await getToken();

            const response = await fetch(
                "http://localhost:5000/api/evidence",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        skillName: selectedSkill,
                        projectId: selectedProject,
                        type: "github",

                        source: {
                            repositoryId:
                                String(project.githubRepo.id),

                            repositoryName:
                                project.githubRepo.fullName ||
                                project.githubRepo.name,

                            repositoryUrl:
                                project.githubRepo.url
                        }
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to create evidence"
                );
            }

            setEvidence((previousEvidence) => [
                data.evidence,
                ...previousEvidence
            ]);

            setSelectedSkill("");
            setSelectedProject("");
            setShowForm(false);

            toast.success("Evidence created successfully");

        } catch (error) {
            console.error(
                "Create evidence failed:",
                error.message
            );

            toast.error(error.message);

        } finally {
            setCreating(false);
        }
    };


    const handleAnalyzeEvidence = async (evidenceId) => {
        try {
            setAnalyzingId(evidenceId);

            const token = await getToken();

            const response = await fetch(
                `http://localhost:5000/api/evidence/${evidenceId}/analyze`,
                {
                    method: "POST",

                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to analyze evidence"
                );
            }

            setEvidence((previousEvidence) =>
                previousEvidence.map((item) =>
                    item._id === evidenceId
                        ? data.evidence
                        : item
                )
            );

            toast.success("Evidence analyzed successfully");

        } catch (error) {
            console.error(
                "AI analysis failed:",
                error.message
            );

            toast.error(error.message);

        } finally {
            setAnalyzingId(null);
        }
    };


    const handleDeleteEvidence = async (evidenceId) => {
        try {
            const token = await getToken();

            const response = await fetch(
                `http://localhost:5000/api/evidence/${evidenceId}`,
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
                    data.message || "Failed to delete evidence"
                );
            }

            setEvidence((previousEvidence) =>
                previousEvidence.filter(
                    (item) => item._id !== evidenceId
                )
            );

            toast.success("Evidence deleted successfully");

        } catch (error) {
            console.error(
                "Delete evidence failed:",
                error.message
            );

            toast.error(error.message);
        }
    };


    if (loading) {
        return (
            <div className="text-white">
                Loading proofs...
            </div>
        );
    }


    return (
        <div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                    <h1 className="text-3xl font-bold text-white">
                        My Proofs
                    </h1>

                    <p className="mt-2 text-slate-400">
                        View the evidence supporting your skills.
                    </p>

                </div>

                <button
                    onClick={() => setShowForm(true)}
                    className="w-full rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-500 sm:w-auto"
                >
                    + Add Proof
                </button>

            </div>


            {showForm && (

                <form
                    onSubmit={handleCreateEvidence}
                    className="mt-8 max-w-xl rounded-xl border border-slate-800 bg-slate-900 p-6"
                >

                    <h2 className="text-xl font-semibold text-white">
                        Add Proof
                    </h2>


                    <div className="mt-5">

                        <label className="text-sm text-slate-300">
                            Skill
                        </label>

                        <select
                            value={selectedSkill}
                            onChange={(e) =>
                                setSelectedSkill(e.target.value)
                            }
                            required
                            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                        >

                            <option value="">
                                Select a skill
                            </option>

                            {skills.map((skill) => (

                                <option
                                    key={skill._id}
                                    value={skill.name}
                                >
                                    {skill.name} — {skill.level}
                                </option>

                            ))}

                        </select>

                    </div>


                    <div className="mt-5">

                        <label className="text-sm text-slate-300">
                            Project
                        </label>

                        <select
                            value={selectedProject}
                            onChange={(e) =>
                                setSelectedProject(e.target.value)
                            }
                            required
                            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                        >

                            <option value="">
                                Select a project
                            </option>

                            {projects.map((project) => (

                                <option
                                    key={project._id}
                                    value={project._id}
                                >
                                    {project.title}
                                </option>

                            ))}

                        </select>

                    </div>


                    <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950 p-4">

                        <p className="text-sm font-medium text-white">
                            Evidence Type
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                            GitHub Repository
                        </p>

                    </div>


                    <div className="mt-6 flex gap-3">

                        <button
                            type="submit"
                            disabled={creating}
                            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {creating
                                ? "Creating..."
                                : "Create Proof"}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                setSelectedSkill("");
                                setSelectedProject("");
                            }}
                            className="rounded-lg border border-slate-700 px-5 py-2.5 font-medium text-slate-300 transition hover:bg-slate-800"
                        >
                            Cancel
                        </button>

                    </div>

                </form>
            )}


            {evidence.length === 0 ? (

                <div className="mt-10 rounded-xl border border-dashed border-slate-700 p-10 text-center">

                    <div className="text-4xl">
                        🔎
                    </div>

                    <h3 className="mt-4 text-xl font-semibold text-white">
                        No proofs added yet
                    </h3>

                    <p className="mt-2 text-slate-400">
                        Add evidence to prove the skills on your profile.
                    </p>

                </div>

            ) : (

                <div className="mt-10 grid gap-5 sm:grid-cols-2">

                    {evidence.map((item) => (

                        <div
                            key={item._id}
                            className="rounded-xl border border-slate-800 bg-slate-900 p-6"
                        >

                            <div className="flex items-start justify-between gap-4">

                                <div>

                                    <h2 className="text-xl font-semibold text-white">
                                        {item.skillName}
                                    </h2>

                                    <p className="mt-2 text-sm text-blue-400">
                                        {item.type === "github"
                                            ? "GitHub Evidence"
                                            : item.type}
                                    </p>

                                </div>

                                <span
                                    className={`rounded-full px-3 py-1 text-xs ${item.status === "analyzed"
                                        ? "bg-blue-500/10 text-blue-400"
                                        : item.status === "verified"
                                            ? "bg-green-500/10 text-green-400"
                                            : item.status === "rejected"
                                                ? "bg-red-500/10 text-red-400"
                                                : "bg-slate-800 text-slate-300"
                                        }`}
                                >
                                    {item.status}
                                </span>

                            </div>


                            {item.project && (

                                <div className="mt-5">

                                    <p className="text-sm text-slate-500">
                                        Project
                                    </p>

                                    <p className="mt-1 font-medium text-white">
                                        {item.project.title}
                                    </p>

                                </div>

                            )}


                            {item.source?.repositoryName && (

                                <div className="mt-4">

                                    <p className="text-sm text-slate-500">
                                        GitHub Repository
                                    </p>

                                    <p className="mt-1 truncate text-sm text-slate-300">
                                        {item.source.repositoryName}
                                    </p>

                                </div>

                            )}


                            {item.aiAnalysis?.score > 0 && (

                                <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950 p-4">

                                    <p className="text-sm text-slate-500">
                                        AI Evidence Score
                                    </p>

                                    <p className="mt-1 text-3xl font-bold text-blue-400">
                                        {item.aiAnalysis.score}/100
                                    </p>

                                    {item.aiAnalysis.summary && (

                                        <p className="mt-3 text-sm leading-6 text-slate-400">
                                            {item.aiAnalysis.summary}
                                        </p>

                                    )}

                                </div>

                            )}


                            <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-800 pt-5">

                                {item.status === "pending" && (

                                    <button
                                        onClick={() =>
                                            handleAnalyzeEvidence(item._id)
                                        }
                                        disabled={analyzingId === item._id}
                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {analyzingId === item._id
                                            ? "Analyzing..."
                                            : "🤖 Analyze with AI"}
                                    </button>

                                )}

                                <button
                                    onClick={() =>
                                        handleDeleteEvidence(item._id)
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
    );
}

export default MyProofs;