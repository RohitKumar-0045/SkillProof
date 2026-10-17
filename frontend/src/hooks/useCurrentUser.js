import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { getCurrentUser } from "../services/userService";

function useCurrentUser() {
    const { getToken, isLoaded, isSignedIn } = useAuth();

    const [appUser, setAppUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userNotFound, setUserNotFound] = useState(false);

    const fetchCurrentUser = useCallback(async () => {

        console.log("Checking current user...");
        console.log("Clerk loaded:", isLoaded);
        console.log("Signed in:", isSignedIn);

        if (!isLoaded) {
            return;
        }

        if (!isSignedIn) {
            setAppUser(null);
            setUserNotFound(false);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const token = await getToken();

            console.log("Token received:", token ? "YES" : "NO");

            const response = await getCurrentUser(token);

            console.log("Response status:", response.status);

            if (response.status === 404) {
                console.log("User not found in MongoDB");

                setUserNotFound(true);
                setAppUser(null);
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to fetch current user");
            }

            const data = await response.json();

            console.log("Current user data:", data);

            setAppUser(data.user);
            setUserNotFound(false);

        } catch (error) {
            console.error("Error fetching current user:", error);

        } finally {
            setLoading(false);
        }

    }, [getToken, isLoaded, isSignedIn]);

    useEffect(() => {
        fetchCurrentUser();
    }, [fetchCurrentUser]);


    return {
        appUser,
        loading,
        userNotFound,
        isSignedIn,
        refetchUser: fetchCurrentUser
    };
}

export default useCurrentUser;