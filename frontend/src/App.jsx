import { SignInButton } from "@clerk/clerk-react";

import RoleSelection from "./components/auth/RoleSelection.jsx";

import StudentDashboard from "./pages/student/StudentDashboard.jsx";

import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard.jsx";

import useCurrentUser from "./hooks/useCurrentUser.js";

function App() {

  const {
    appUser,
    loading,
    userNotFound,
    isSignedIn,
    refetchUser,
  } = useCurrentUser();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center text-white">
        Loading SkillProof...
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">

        <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl">
          Skill<span className="text-blue-500">Proof</span>
        </h1>

        <p className="mt-4 text-sm text-slate-400 sm:text-base">
          Prove your skills. Build trust.
        </p>

        <SignInButton>
          <button className="mt-8 w-full max-w-xs rounded-lg bg-blue-600 px-6 py-3 font-medium transition hover:bg-blue-500 sm:w-auto">
            Sign In
          </button>
        </SignInButton>

      </div>
    );
  }

  if (userNotFound) {
    return <RoleSelection onUserCreated={refetchUser} />;
  }

  if (appUser?.role === "student") {
    return <StudentDashboard user={appUser} />;
  }

  if (appUser?.role === "recruiter") {
    return <RecruiterDashboard user={appUser} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center text-white">
      Something went wrong.
    </div>
  );
}

export default App;