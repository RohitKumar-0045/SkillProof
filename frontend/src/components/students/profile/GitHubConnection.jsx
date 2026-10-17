import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
const API_URL = import.meta.env.VITE_API_URL;
function GitHubConnection() {
    const { getToken } = useAuth();

    const [connected, setConnected] = useState(false);
    const [github, setGithub] = useState(null);
    const [repositories, setRepositories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingRepositories, setLoadingRepositories] = useState(false);
    const [connecting, setConnecting] = useState(false);

    const fetchGitHubConnection = async () => {
        try {
            setLoading(true);

            const token = await getToken();

            const response = await fetch(
                `${API_URL}/api/github/connection`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load GitHub connection"
                );
            }

            setConnected(data.connected);
            setGithub(data.github);

            if (data.connected) {
                await fetchRepositories(token);
            }

        } catch (error) {
            console.error(
                "GitHub connection error:",
                error.message
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchRepositories = async (token) => {
        try {
            setLoadingRepositories(true);

            const response = await fetch(
                `${API_URL}/api/github/repos`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load repositories"
                );
            }

            setRepositories(data.repositories || []);

        } catch (error) {
            console.error(
                "Repository loading error:",
                error.message
            );

            toast.error(error.message);
        } finally {
            setLoadingRepositories(false);
        }
    };

    useEffect(() => {
        fetchGitHubConnection();
    }, []);

    const handleConnectGitHub = async () => {
        try {
            setConnecting(true);

            const token = await getToken();

            const response = await fetch(
                `${API_URL}/api/github/connect`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to connect GitHub"
                );
            }

            window.location.href = data.githubUrl;

        } catch (error) {
            console.error(
                "GitHub connection failed:",
                error.message
            );

            toast.error(error.message);
            setConnecting(false);
        }
    };

    const handleRefreshRepositories = async () => {
        try {
            const token = await getToken();

            await fetchRepositories(token);

            toast.success("Repositories refreshed");
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (loading) {
        return (
            <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
                <p className="text-slate-400">
                    Loading GitHub connection...
                </p>
            </div>
        );
    }

    return (
        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div>
                    <h2 className="text-xl font-semibold text-white">
                        GitHub
                    </h2>

                    {connected ? (
                        <div className="mt-3 flex items-center gap-3">

                            {github?.avatarUrl && (
                                <img
                                    src={github.avatarUrl}
                                    alt="GitHub avatar"
                                    className="h-10 w-10 rounded-full"
                                />
                            )}

                            <div>
                                <p className="font-medium text-white">
                                    @{github?.username}
                                </p>

                                <p className="text-sm text-green-400">
                                    ✓ GitHub connected
                                </p>
                            </div>

                        </div>
                    ) : (
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            Connect your GitHub account to provide
                            real technical evidence of your skills.
                        </p>
                    )}
                </div>

                {connected ? (
                    <button
                        onClick={handleConnectGitHub}
                        className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-500"
                    >
                        Reconnect GitHub
                    </button>
                ) : (
                    <button
                        onClick={handleConnectGitHub}
                        className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-500"
                    >
                        Connect GitHub
                    </button>
                )}

            </div>

            {connected && (
                <div className="mt-8 border-t border-slate-800 pt-6">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                            <h3 className="text-lg font-semibold text-white">
                                GitHub Repositories
                            </h3>

                            <p className="mt-1 text-sm text-slate-400">
                                Your repositories can be used as technical evidence.
                            </p>
                        </div>

                        <button
                            onClick={handleRefreshRepositories}
                            disabled={loadingRepositories}
                            className="w-full rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            {loadingRepositories
                                ? "Refreshing..."
                                : "↻ Refresh"}
                        </button>

                    </div>

                    {loadingRepositories ? (
                        <div className="mt-6 rounded-lg border border-slate-800 p-6 text-center">
                            <p className="text-slate-400">
                                Loading repositories...
                            </p>
                        </div>
                    ) : repositories.length === 0 ? (
                        <div className="mt-6 rounded-lg border border-dashed border-slate-700 p-8 text-center">
                            <div className="text-3xl">
                                📦
                            </div>

                            <h4 className="mt-3 font-semibold text-white">
                                No repositories found
                            </h4>

                            <p className="mt-2 text-sm text-slate-400">
                                Create a GitHub repository and refresh this section.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">

                            {repositories.map((repository) => (
                                <div
                                    key={repository.id}
                                    className="min-w-0 rounded-xl border border-slate-800 bg-slate-950 p-5"
                                >

                                    <div className="flex items-start justify-between gap-3">

                                        <div className="min-w-0">

                                            <h4 className="truncate text-lg font-semibold text-white">
                                                {repository.name}
                                            </h4>

                                            <p className="mt-1 truncate text-sm text-slate-500">
                                                {repository.fullName}
                                            </p>

                                        </div>

                                        {repository.fork && (
                                            <span className="shrink-0 rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
                                                Fork
                                            </span>
                                        )}

                                    </div>

                                    <p className="mt-4 min-h-12 text-sm leading-6 text-slate-400">
                                        {repository.description ||
                                            "No description provided."}
                                    </p>

                                    <div className="mt-4 flex flex-wrap items-center gap-3">

                                        {repository.language && (
                                            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
                                                {repository.language}
                                            </span>
                                        )}

                                        <span className="text-xs text-slate-500">
                                            ⭐ {repository.stars}
                                        </span>

                                    </div>

                                    <div className="mt-5 border-t border-slate-800 pt-4">

                                        <a
                                            href={repository.htmlUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm font-medium text-blue-400 hover:text-blue-300"
                                        >
                                            View on GitHub →
                                        </a>

                                    </div>

                                </div>
                            ))}

                        </div>
                    )}

                </div>
            )}

        </div>
    );
}

export default GitHubConnection;