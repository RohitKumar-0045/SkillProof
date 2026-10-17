import { useAuth, useUser } from "@clerk/clerk-react";
const API_URL = import.meta.env.VITE_API_URL;
function RoleSelection({ onUserCreated }) {
    const { getToken } = useAuth();
    const { user } = useUser();
    const handleRoleSelection = async (role) => {
        try {
            const token = await getToken();

            const response = await fetch(
                `${API_URL}/api/users`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.primaryEmailAddress.emailAddress,
                        role: role,
                    }),
                }
            );

            const data = await response.json();

            console.log(data);

            // Tell App.jsx that the user was created
            if (response.ok && onUserCreated) {
                await onUserCreated();
            }

        } catch (error) {
            console.error(
                "Error occurred while selecting role:",
                error
            );
        }
    };
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">

            <div className="w-full max-w-4xl">

                {/* Heading */}
                <div className="text-center">

                    <p className="mb-4 text-sm font-medium uppercase tracking-widest text-blue-400">
                        Welcome to SkillProof
                    </p>

                    <h1 className="text-4xl font-bold md:text-5xl">
                        How do you want to use
                        <span className="text-blue-500"> SkillProof?</span>
                    </h1>

                    <p className="mx-auto mt-5 max-w-xl text-slate-400">
                        Choose your role to personalize your SkillProof experience.
                    </p>

                </div>


                {/* Role Cards */}
                <div className="mt-12 grid gap-6 md:grid-cols-2">

                    {/* Student */}
                    <button
                        onClick={() => handleRoleSelection("student")}
                        className="group rounded-2xl border border-slate-800 bg-slate-900 p-8 text-left transition hover:-translate-y-1 hover:border-blue-500 hover:bg-slate-900/80"
                    >

                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 text-3xl">
                            🎓
                        </div>

                        <h2 className="text-2xl font-semibold">
                            I'm a Student
                        </h2>

                        <p className="mt-3 leading-relaxed text-slate-400">
                            Showcase your skills through projects, evidence,
                            and verified achievements.
                        </p>

                        <div className="mt-8 font-medium text-blue-400">
                            Build my profile →
                        </div>

                    </button>


                    {/* Recruiter */}
                    <button
                        onClick={() => handleRoleSelection("recruiter")}
                        className="group rounded-2xl border border-slate-800 bg-slate-900 p-8 text-left transition hover:-translate-y-1 hover:border-blue-500 hover:bg-slate-900/80"
                    >

                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 text-3xl">
                            💼
                        </div>

                        <h2 className="text-2xl font-semibold">
                            I'm a Recruiter
                        </h2>

                        <p className="mt-3 leading-relaxed text-slate-400">
                            Discover candidates through demonstrated skills,
                            projects, and verified evidence.
                        </p>

                        <div className="mt-8 font-medium text-blue-400">
                            Find talented candidates →
                        </div>

                    </button>

                </div>

            </div>

        </div>
    );
}

export default RoleSelection;