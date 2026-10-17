function RecruiterSidebar({
    activeSection,
    setActiveSection,
    sidebarOpen,
    setSidebarOpen
}) {

    const menuItems = [
        {
            id: "overview",
            icon: "📊",
            label: "Overview"
        },
        {
            id: "discover",
            icon: "🔍",
            label: "Discover Students"
        },
        {
            id: "saved",
            icon: "⭐",
            label: "Saved Candidates"
        },
        {
            id: "jobs",
            icon: "💼",
            label: "Job Posts"
        },
        {
            id: "assignments",
            icon: "📝",
            label: "Assignments"
        },
        {
            id: "profile",
            icon: "👤",
            label: "Profile"
        }
    ];

    const handleSectionChange = (section) => {
        setActiveSection(section);
        setSidebarOpen(false);
    };

    return (
        <>
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-950 text-white transition-transform duration-300 md:static md:translate-x-0 ${sidebarOpen
                    ? "translate-x-0"
                    : "-translate-x-full"
                    }`}
            >

                <div className="flex items-start justify-between border-b border-slate-800 px-6 py-6">

                    <div>
                        <h1 className="text-2xl font-bold">
                            Skill<span className="text-blue-500">Proof</span>
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Recruiter Portal
                        </p>
                    </div>

                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="text-xl text-slate-400 hover:text-white md:hidden"
                    >
                        ✕
                    </button>

                </div>

                <nav className="flex flex-1 flex-col gap-2 p-4">

                    {menuItems.map((item) => (

                        <button
                            key={item.id}
                            onClick={() => handleSectionChange(item.id)}
                            className={`rounded-lg px-4 py-3 text-left font-medium transition ${activeSection === item.id
                                ? "bg-blue-600 text-white"
                                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                                }`}
                        >

                            <span className="mr-3">
                                {item.icon}
                            </span>

                            {item.label}

                        </button>

                    ))}

                </nav>

                <div className="border-t border-slate-800 p-4">

                    <p className="text-sm text-slate-500">
                        SkillProof © 2026
                    </p>

                </div>

            </aside>
        </>
    );
}

export default RecruiterSidebar;