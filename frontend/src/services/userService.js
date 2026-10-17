const API_URL = import.meta.env.VITE_API_URL;

export const getCurrentUser = async (token) => {
    const response = await fetch(`${API_URL}/api/users/me`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response;
};