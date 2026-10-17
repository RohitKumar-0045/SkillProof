import { useAuth, useUser } from "@clerk/clerk-react";
const API_URL = import.meta.env.VITE_API_URL;
function CreateUser() {
    const { getToken } = useAuth();
    const { user } = useUser();

    const createUser = async () => {
        try {
            const token = await getToken();

            const response = await fetch(`${API_URL}/api/users`, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },

                body: JSON.stringify({
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.primaryEmailAddress.emailAddress,
                    role: "student",
                }),
            });

            const data = await response.json();

            console.log(data);
        } catch (error) {
            console.error("Create user failed:", error);
        }
    };

    return (
        <button onClick={createUser}>
            Create SkillProof User
        </button>
    );
}

export default CreateUser;