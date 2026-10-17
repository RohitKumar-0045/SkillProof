import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";

function MyProjects({ onProjectsChanged }) {
    const { getToken } = useAuth();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProject, setEditingProject] = useState(null);

    const [githubRepositories, setGithubRepositories] = useState([]);
    const [loadingGithubRepositories, setLoadingGithubRepositories] = useState(false);
    const [selectedGithubRepo, setSelectedGithubRepo] = useState(null);

    const [showForm, setShowForm] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [technologies, setTechnologies] = useState("");
    const [githubUrl, setGithubUrl] = useState("");
    const [liveUrl, setLiveUrl] = useState("");

    const fetchProjects = async () => {
        try {
            setLoading(true);

            const token = await getToken();

            const response = await fetch(
                "http://localhost:5000/api/projects",
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
                    data.message || "Failed to load projects"
                );
            }

            setProjects(data.projects || []);

            if (onProjectsChanged) {
                onProjectsChanged(data.projects || []);
            }
        } catch (error) {
            console.error(
                "Failed to load projects:",
                error.message
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchGitHubRepositories = async () => {
        try {
            setLoadingGithubRepositories(true);

            const token = await getToken();

            const response = await fetch(
                "http://localhost:5000/api/github/repos",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error(
                        "GitHub connection expired. Please reconnect GitHub from your Profile."
                    );
                } else {
                    toast.error(
                        data.message ||
                        "Failed to load GitHub repositories"
                    );
                }

                setGithubRepositories([]);
                return;
            }

            setGithubRepositories(
                data.repositories || []
            );

            if (
                !data.repositories ||
                data.repositories.length === 0
            ) {
                toast.error(
                    "No GitHub repositories found."
                );
            }
        } catch (error) {
            console.error(
                "Failed to load GitHub repositories:",
                error.message
            );

            setGithubRepositories([]);

            toast.error(
                "Unable to load GitHub repositories"
            );
        } finally {
            setLoadingGithubRepositories(false);
        }
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setTechnologies("");
        setGithubUrl("");
        setLiveUrl("");
        setSelectedGithubRepo(null);
        setEditingProject(null);
        setShowForm(false);
    };

    const openCreateForm = async () => {
        setEditingProject(null);
        setTitle("");
        setDescription("");
        setTechnologies("");
        setGithubUrl("");
        setLiveUrl("");
        setSelectedGithubRepo(null);
        setShowForm(true);

        await fetchGitHubRepositories();
    };

    const openEditForm = async (project) => {
        setEditingProject(project);

        setTitle(project.title || "");
        setDescription(project.description || "");

        setTechnologies(
            project.technologies?.join(", ") || ""
        );

        setGithubUrl(
            project.githubUrl ||
            project.githubRepo?.url ||
            ""
        );

        setLiveUrl(project.liveUrl || "");

        setSelectedGithubRepo(
            project.githubRepo?.id
                ? {
                    id: project.githubRepo.id,
                    name: project.githubRepo.name || "",
                    fullName:
                        project.githubRepo.fullName || "",
                    htmlUrl:
                        project.githubRepo.url || "",
                    url:
                        project.githubRepo.url || "",
                }
                : null
        );

        setShowForm(true);

        await fetchGitHubRepositories();
    };

    const handleSubmitProject = async (e) => {
        e.preventDefault();

        if (
            githubRepositories.length > 0 &&
            !selectedGithubRepo
        ) {
            toast.error(
                "Please select a GitHub repository."
            );
            return;
        }

        if (
            githubUrl &&
            !selectedGithubRepo
        ) {
            toast.error(
                "Please select your GitHub repository from the list."
            );
            return;
        }

        try {
            const token = await getToken();

            const technologyArray = technologies
                .split(",")
                .map((technology) => technology.trim())
                .filter(
                    (technology) =>
                        technology !== ""
                );

            const githubRepositoryData =
                selectedGithubRepo
                    ? {
                        id: String(
                            selectedGithubRepo.id
                        ),
                        name:
                            selectedGithubRepo.name ||
                            "",
                        fullName:
                            selectedGithubRepo.fullName ||
                            "",
                        url:
                            selectedGithubRepo.htmlUrl ||
                            selectedGithubRepo.url ||
                            "",
                    }
                    : null;

            const requestBody = {
                title,
                description,
                technologies: technologyArray,
                githubUrl:
                    selectedGithubRepo?.htmlUrl ||
                    selectedGithubRepo?.url ||
                    githubUrl,
                githubRepo: githubRepositoryData,
                liveUrl,
            };

            const isEditing =
                Boolean(editingProject);

            const url = isEditing
                ? `http://localhost:5000/api/projects/${editingProject._id}`
                : "http://localhost:5000/api/projects";

            const response = await fetch(url, {
                method: isEditing
                    ? "PUT"
                    : "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(
                    requestBody
                ),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    (
                        isEditing
                            ? "Failed to update project"
                            : "Failed to create project"
                    )
                );
            }

            if (isEditing) {
                setProjects((previousProjects) => {
                    const updatedProjects =
                        previousProjects.map(
                            (project) =>
                                project._id ===
                                    editingProject._id
                                    ? data.project
                                    : project
                        );

                    if (onProjectsChanged) {
                        onProjectsChanged(
                            updatedProjects
                        );
                    }

                    return updatedProjects;
                });

                toast.success(
                    "Project updated successfully"
                );
            } else {
                setProjects((previousProjects) => {
                    const updatedProjects = [
                        data.project,
                        ...previousProjects,
                    ];

                    if (onProjectsChanged) {
                        onProjectsChanged(
                            updatedProjects
                        );
                    }

                    return updatedProjects;
                });

                toast.success(
                    "Project created successfully"
                );
            }

            resetForm();
        } catch (error) {
            console.error(
                isEditing
                    ? "Update project failed:"
                    : "Create project failed:",
                error.message
            );

            toast.error(error.message);
        }
    };

    const handleDeleteProject = async (projectId) => {
        try {
            const token = await getToken();

            const response = await fetch(
                `http://localhost:5000/api/projects/${projectId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to delete project"
                );
            }

            setProjects((previousProjects) => {
                const updatedProjects =
                    previousProjects.filter(
                        (project) =>
                            project._id !== projectId
                    );

                if (onProjectsChanged) {
                    onProjectsChanged(
                        updatedProjects
                    );
                }

                return updatedProjects;
            });

            toast.success(
                "Project deleted successfully"
            );
        } catch (error) {
            console.error(
                "Delete project failed:",
                error.message
            );

            toast.error(error.message);
        }
    };

    if (loading) {
        return (
            <div className="text-white">
                Loading projects...
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
                        My Projects
                    </h1>

                    <p className="mt-2 text-slate-400 leading-6 sm:text-base">
                        Showcase projects that demonstrate your real skills.
                    </p>
                </div>

                <button
                    onClick={openCreateForm}
                    className="w-full rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-500 sm:w-auto"
                >
                    + Add Project
                </button>
            </div>

            {showForm && (
                <form
                    onSubmit={handleSubmitProject}
                    className="mt-8 w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-6"
                >
                    <h2 className="text-xl font-semibold text-white sm:text-xl">
                        {editingProject
                            ? "Edit Project"
                            : "Add a Project"}
                    </h2>

                    <div className="mt-5">
                        <label className="text-sm text-slate-300">
                            Project Title
                        </label>

                        <input
                            type="text"
                            value={title}
                            onChange={(e) =>
                                setTitle(
                                    e.target.value
                                )
                            }
                            placeholder="Example: SkillProof"
                            required
                            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="mt-5">
                        <label className="text-sm text-slate-300">
                            Description
                        </label>

                        <textarea
                            value={description}
                            onChange={(e) =>
                                setDescription(
                                    e.target.value
                                )
                            }
                            placeholder="Describe what your project does..."
                            required
                            rows="4"
                            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="mt-5">
                        <label className="text-sm text-slate-300">
                            Technologies
                        </label>

                        <input
                            type="text"
                            value={technologies}
                            onChange={(e) =>
                                setTechnologies(
                                    e.target.value
                                )
                            }
                            placeholder="React, Node.js, Express, MongoDB"
                            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                        />

                        <p className="mt-2 text-xs text-slate-500">
                            Separate technologies using commas.
                        </p>
                    </div>

                    <div className="mt-5">
                        <label className="text-sm text-slate-300">
                            GitHub Repository
                        </label>

                        {loadingGithubRepositories ? (
                            <p className="mt-2 text-sm text-slate-500">
                                Loading GitHub repositories...
                            </p>
                        ) : githubRepositories.length === 0 ? (
                            <p className="mt-2 text-sm text-slate-500">
                                No GitHub repositories available.
                            </p>
                        ) : (
                            <select
                                value={
                                    selectedGithubRepo?.id ||
                                    ""
                                }
                                onChange={(e) => {
                                    const repository =
                                        githubRepositories.find(
                                            (repo) =>
                                                String(
                                                    repo.id
                                                ) ===
                                                e.target.value
                                        );

                                    setSelectedGithubRepo(
                                        repository ||
                                        null
                                    );

                                    if (repository) {
                                        setGithubUrl(
                                            repository.htmlUrl ||
                                            repository.url ||
                                            ""
                                        );
                                    }
                                }}
                                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                            >
                                <option value="">
                                    Select a repository
                                </option>

                                {githubRepositories.map(
                                    (repository) => (
                                        <option
                                            key={
                                                repository.id
                                            }
                                            value={
                                                repository.id
                                            }
                                        >
                                            {
                                                repository.fullName
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        )}

                        <p className="mt-2 text-xs text-slate-500">
                            Link this project to the GitHub repository containing its source code.
                        </p>
                    </div>

                    <div className="mt-5">
                        <label className="text-sm text-slate-300">
                            GitHub Repository URL
                        </label>

                        <input
                            type="url"
                            value={githubUrl}
                            onChange={(e) =>
                                setGithubUrl(
                                    e.target.value
                                )
                            }
                            placeholder="https://github.com/username/project"
                            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="mt-5">
                        <label className="text-sm text-slate-300">
                            Live Demo URL
                        </label>

                        <input
                            type="url"
                            value={liveUrl}
                            onChange={(e) =>
                                setLiveUrl(
                                    e.target.value
                                )
                            }
                            placeholder="https://your-project.com"
                            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
                        <button
                            type="submit"
                            className="w-full rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-500 sm:w-auto"
                        >
                            {editingProject
                                ? "Update Project"
                                : "Save Project"}
                        </button>

                        <button
                            type="button"
                            onClick={resetForm}
                            className="w-full rounded-lg border border-slate-700 px-5 py-2.5 text-slate-300 transition hover:bg-slate-800 sm:w-auto"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {projects.length === 0 ? (
                <div className="mt-8 rounded-xl border border-dashed border-slate-700 p-6 text-center sm:mt-10 sm:p-10">
                    <div className="text-4xl">
                        🚀
                    </div>

                    <h3 className="mt-4 text-xl font-semibold text-white sm:text-xl">
                        No projects added yet
                    </h3>

                    <p className="mt-2 text-slate-400 sm:text-base">
                        Add a project to demonstrate your skills with real work.
                    </p>
                </div>
            ) : (
                <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:gap-5 lg:grid-cols-2">
                    {projects.map((project) => (
                        <div
                            key={project._id}
                            className="min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-6"
                        >
                            <h2 className="text-lg font-semibold text-white sm:text-xl">
                                {project.title}
                            </h2>

                            <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
                                {project.description}
                            </p>

                            {project.technologies?.length > 0 && (
                                <div className="mt-5 flex flex-wrap gap-2">
                                    {project.technologies.map(
                                        (
                                            technology,
                                            index
                                        ) => (
                                            <span
                                                key={`${technology}-${index}`}
                                                className="max-w-full rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400 sm:text-sm"
                                            >
                                                {
                                                    technology
                                                }
                                            </span>
                                        )
                                    )}
                                </div>
                            )}

                            {project.githubRepo?.id && (
                                <div className="mt-5 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
                                    <p className="text-xs text-slate-500">
                                        Linked GitHub Repository
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-green-400">
                                        {
                                            project.githubRepo
                                                .fullName
                                        }
                                    </p>
                                </div>
                            )}

                            {(project.githubUrl ||
                                project.liveUrl) && (
                                    <div className="mt-6 flex flex-wrap gap-3 sm:gap-4">
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
                                )}

                            <div className="mt-6 flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row">
                                <button
                                    onClick={() =>
                                        openEditForm(
                                            project
                                        )
                                    }
                                    className="w-full rounded-lg border border-blue-500/30 px-4 py-2 text-sm font-medium text-blue-400 transition hover:bg-blue-500/10 sm:w-auto"
                                >
                                    ✏️ Edit
                                </button>

                                <button
                                    onClick={() =>
                                        handleDeleteProject(
                                            project._id
                                        )
                                    }
                                    className="w-full rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 sm:w-auto"
                                >
                                    🗑 Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyProjects;