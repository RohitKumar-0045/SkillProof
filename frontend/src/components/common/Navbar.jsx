import { UserButton } from "@clerk/clerk-react";

function Navbar({ user, setSidebarOpen }) {
    return (
        <header className="flex min-h-20 items-center justify-between gap-4 border-b border-slate-800 bg-slate-950 px-4 py-3 text-white sm:px-6 lg:px-8">

            <div className="flex min-w-0 items-center gap-3">

                <button
                    onClick={() => setSidebarOpen(true)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-2xl text-slate-300 transition hover:bg-slate-900 hover:text-white md:hidden"
                >
                    ☰
                </button>

                <div className="min-w-0">

                    <h2 className="truncate text-base font-semibold sm:text-xl">
                        Welcome back, {user?.firstName || "User"} 👋
                    </h2>

                    <p className="mt-1 hidden text-sm text-slate-400 sm:block">
                        Continue building your verified skill profile.
                    </p>

                </div>

            </div>

            <div className="shrink-0">
                <UserButton />
            </div>

        </header>
    );
}

export default Navbar;