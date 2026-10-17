import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
const API_URL = import.meta.env.VITE_API_URL;
function MySkills({ onSkillsChanged }) {

    const { getToken } = useAuth();

    const [showForm, setShowForm] = useState(false);

    const [skills, setSkills] = useState([]);

    const [name, setName] = useState("");
    const [category, setCategory] = useState("Technical");
    const [level, setLevel] = useState("Beginner");

    const [editingSkillId, setEditingSkillId] = useState(null);

    useEffect(() => {

        const loadSkills = async () => {

            try {

                const token = await getToken();

                const response = await fetch(
                    `${API_URL}/api/users/me`,
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
                        data.message || "Failed to load skills"
                    );
                }

                setSkills(data.user.skills || []);

            } catch (error) {

                console.error(
                    "Failed to load skills:",
                    error.message
                );

                toast.error("Failed to load skills");

            }
        };

        loadSkills();

    }, [getToken]);

    const handleEditSkill = (skill) => {

        setName(skill.name);

        setCategory(skill.category);

        setLevel(skill.level);

        setEditingSkillId(skill._id);

        setShowForm(true);

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            const token = await getToken();

            let response;

            if (editingSkillId) {

                response = await fetch(
                    `${API_URL}/api/users/skills/${editingSkillId}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },

                        body: JSON.stringify({
                            name,
                            category,
                            level,
                        }),
                    }
                );

            } else {

                response = await fetch(
                    `${API_URL}/api/users/skills`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },

                        body: JSON.stringify({
                            name,
                            category,
                            level,
                        }),
                    }
                );
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to save skill"
                );
            }

            setSkills(data.skills);

            if (onSkillsChanged) {
                onSkillsChanged(data.skills);
            }

            toast.success(
                editingSkillId
                    ? "Skill updated successfully"
                    : "Skill added successfully"
            );

            setName("");
            setCategory("Technical");
            setLevel("Beginner");

            setEditingSkillId(null);

            setShowForm(false);

        } catch (error) {

            console.error(
                "Save skill failed:",
                error.message
            );

            toast.error(error.message);

        }
    };

    const handleRemoveSkill = async (skillId) => {

        try {

            const token = await getToken();

            const response = await fetch(
                `${API_URL}/api/users/skills/${skillId}`,
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
                    data.message || "Failed to remove skill"
                );
            }

            setSkills(data.skills);

            if (onSkillsChanged) {
                onSkillsChanged(data.skills);
            }

            toast.success("Skill removed successfully");

        } catch (error) {

            console.error(
                "Remove skill failed:",
                error.message
            );

            toast.error(error.message);

        }
    };

    return (
        <div>

            <div className="flex items-center justify-between">

                <div>

                    <h1 className="text-3xl font-bold text-white">
                        My Skills
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Add and manage the skills you want to showcase.
                    </p>

                </div>

                <button
                    onClick={() => {
                        setShowForm(true);
                        setEditingSkillId(null);
                        setName("");
                        setCategory("Technical");
                        setLevel("Beginner");
                    }}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-500"
                >
                    + Add Skill
                </button>

            </div>

            {showForm && (

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 max-w-xl rounded-xl border border-slate-800 bg-slate-900 p-6"
                >

                    <h2 className="text-xl font-semibold text-white">
                        {editingSkillId
                            ? "Edit Skill"
                            : "Add a Skill"}
                    </h2>

                    <div className="mt-5">

                        <label className="text-sm text-slate-300">
                            Skill Name
                        </label>

                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Example: React"
                            required
                            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                        />

                    </div>

                    <div className="mt-5">

                        <label className="text-sm text-slate-300">
                            Category
                        </label>

                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                        >

                            <option value="Technical">
                                Technical
                            </option>

                            <option value="Programming">
                                Programming
                            </option>

                            <option value="Framework">
                                Framework
                            </option>

                            <option value="Tool">
                                Tool
                            </option>

                            <option value="Soft Skill">
                                Soft Skill
                            </option>

                        </select>

                    </div>

                    <div className="mt-5">

                        <label className="text-sm text-slate-300">
                            Level
                        </label>

                        <select
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                        >

                            <option value="Beginner">
                                Beginner
                            </option>

                            <option value="Intermediate">
                                Intermediate
                            </option>

                            <option value="Advanced">
                                Advanced
                            </option>

                            <option value="Expert">
                                Expert
                            </option>

                        </select>

                    </div>

                    <div className="mt-6 flex gap-3">

                        <button
                            type="submit"
                            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-500"
                        >
                            {editingSkillId
                                ? "Update Skill"
                                : "Add Skill"}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                setEditingSkillId(null);
                                setName("");
                                setCategory("Technical");
                                setLevel("Beginner");
                            }}
                            className="rounded-lg border border-slate-700 px-5 py-2.5 font-medium text-slate-300 transition hover:bg-slate-800"
                        >
                            Cancel
                        </button>

                    </div>

                </form>
            )}

            {skills.length === 0 ? (

                <div className="mt-10 rounded-xl border border-dashed border-slate-700 p-10 text-center">

                    <div className="text-4xl">
                        🚀
                    </div>

                    <h3 className="mt-4 text-xl font-semibold text-white">
                        No skills added yet
                    </h3>

                    <p className="mt-2 text-slate-400">
                        Start building your SkillProof profile by adding your first skill.
                    </p>

                </div>

            ) : (

                <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                    {skills.map((skill) => (

                        <div
                            key={skill._id}
                            className="group rounded-xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500"
                        >

                            <div className="flex items-start justify-between gap-4">

                                <div>

                                    <h3 className="text-xl font-semibold text-white">
                                        {skill.name}
                                    </h3>

                                    <p className="mt-2 text-sm text-blue-400">
                                        {skill.category}
                                    </p>

                                </div>

                                <div className="flex gap-2">

                                    <button
                                        onClick={() => handleEditSkill(skill)}
                                        className="rounded-lg border border-blue-500/30 px-3 py-1.5 text-sm font-medium text-blue-400 transition hover:bg-blue-500/10"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleRemoveSkill(skill._id)
                                        }
                                        className="rounded-lg border border-red-500/30 px-3 py-1.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
                                    >
                                        Remove
                                    </button>

                                </div>

                            </div>

                            <div className="mt-5 flex items-center justify-between">

                                <span className="rounded-full bg-slate-800 px-3 py-1.5 text-sm text-slate-300">
                                    {skill.level}
                                </span>

                                <span className="text-sm text-slate-500">
                                    Skill
                                </span>

                            </div>

                        </div>

                    ))}

                </div>

            )}

        </div>
    );
}

export default MySkills;