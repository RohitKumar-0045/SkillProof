export const getCurrentUser = async (token) => {
    const response = await fetch("http://localhost:5000/api/users/me",
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            },
        }
    );
    return response;
}