function Sidebar({ activeSection, setActiveSection }) {

    const menuItems = [
        {
            id: "overview",
            icon: "📊",
            label: "Overview"
        },
        {
            id: "skills",
            icon: "🧠",
            label: "My Skills"
        },
        {
            id: "projects",
            icon: "🚀",
            label: "Projects"
        },
        {
            id: "jobs",
            icon: "💼",
            label: "Jobs"
        },
        {
            id: "assignments",
            icon: "📝",
            label: "Assignments"
        },
        {
            id: "proofs",
            icon: "🛡️",
            label: "My Proofs"
        },
        {
            id: "profile",
            icon: "👤",
            label: "Profile"
        }
    ];

    return (
        <aside className="flex min-h-screen w-64 flex-col border-r border-slate-800 bg-slate-950 text-white">

            {/* Logo */}
            <div className="border-b border-slate-800 px-6 py-6">

                <h1 className="text-2xl font-bold">
                    Skill<span className="text-blue-500">Proof</span>
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    Student Portal
                </p>

            </div>


            {/* Navigation */}
            <nav className="flex flex-1 flex-col gap-2 p-4">

                {menuItems.map((item) => (

                    <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
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


            {/* Bottom */}
            <div className="border-t border-slate-800 p-4">

                <p className="text-sm text-slate-500">
                    SkillProof © 2026
                </p>

            </div>

        </aside>
    );
}

export default Sidebar;