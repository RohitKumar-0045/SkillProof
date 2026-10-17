import { useAuth } from "@clerk/clerk-react";

function TestBackend() {
    const { getToken, isSignedIn } = useAuth();

    const callBackend = async () => {
        try {
            const token = await getToken();

            const response = await fetch(
                "http://localhost:5000/api/protected",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            console.log(data);
        } catch (error) {
            console.error("Backend request failed:", error);
        }
    };

    if (!isSignedIn) {
        return <p>Please sign in first.</p>;
    }

    return (
        <button onClick={callBackend}>
            Test Backend
        </button>
    );
}

export default TestBackend;