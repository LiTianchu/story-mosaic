import { useState, useEffect, useRef } from "react";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged,
    updateProfile,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "../config/firebase";
import { authApi, ApiError } from "../services/api";
import type { AuthState } from "../types/auth";

export const useAuth = () => {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        loading: true,
        error: null,
    });

    // Flag to prevent syncUserWithBackend from creating user during signup
    const isSigningUp = useRef(false);

    // Sync user profile with backend when auth state changes
    const syncUserWithBackend = async (firebaseUser: User | null) => {
        if (!firebaseUser) {
            setAuthState({
                user: null,
                loading: false,
                error: null,
            });
            return;
        }

        try {
            // Try to fetch user profile from backend to get MongoDB _id
            let userProfile;
            try {
                userProfile = await authApi.getUserByUid(firebaseUser.uid);
            } catch (error) {
                // If user doesn't exist in backend (404), create them (can happen when testing locally after clearing DB)
                if (error instanceof ApiError && error.status === 404) {
                    // Don't create user if we're in the middle of signup (to avoid race condition)
                    if (isSigningUp.current) {
                        console.log('Skipping user creation - signup in progress');
                        // Set a temporary user state without backend _id
                        setAuthState({
                            user: {
                                _id: '', // Will be populated after signup completes
                                uid: firebaseUser.uid,
                                email: firebaseUser.email,
                                displayName: firebaseUser.displayName || 'Anonymous User',
                            },
                            loading: false,
                            error: null,
                        });
                        return;
                    }

                    console.log('User not found in backend, creating profile...');
                    console.log('firebaseUser.displayName:', firebaseUser.displayName);
                    const displayNameToUse = firebaseUser.displayName || 'Anonymous User';
                    console.log('displayNameToUse:', displayNameToUse);
                    userProfile = await authApi.createUserProfile({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email!,
                        displayName: displayNameToUse,
                    });
                    console.log('Created user profile in backend:', userProfile);
                } else {
                    throw error;
                }
            }
            
            setAuthState({
                user: {
                    _id: userProfile._id, // MongoDB _id for business logic
                    uid: firebaseUser.uid, // Firebase uid for auth
                    email: firebaseUser.email,
                    displayName: userProfile.displayName, // Use backend displayName, not Firebase
                },
                loading: false,
                error: null,
            });
        } catch (error) {
            console.error("Failed to sync user with backend:", error);
            // Fallback to Firebase data if backend sync fails
            setAuthState({
                user: {
                    _id: '', // Empty _id as fallback
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                },
                loading: false,
                error: null,
            });
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            await syncUserWithBackend(user);
        });

        return unsubscribe;
    }, []);

    const login = async (email: string, password: string) => {
        setAuthState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // User sync happens automatically in onAuthStateChanged

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            setAuthState((prev) => ({
                ...prev,
                loading: false,
                error: getAuthErrorMessage(error.code),
            }));
        }
    };

    const signup = async (
        email: string,
        password: string,
        displayName?: string,
    ) => {
        setAuthState((prev) => ({ ...prev, loading: true, error: null }));
        isSigningUp.current = true; // Set flag to prevent race condition
        try {
            console.log('Signup called with displayName:', displayName);
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password,
            );
            const user = userCredential.user;
            console.log('Firebase user created, current displayName:', user.displayName);

            // Determine the display name to use (provided, or default to "Anonymous User")
            const finalDisplayName = displayName || "Anonymous User";
            console.log('finalDisplayName to set:', finalDisplayName);

            // Update display name in Firebase
            await updateProfile(user, {
                displayName: finalDisplayName,
            });
            console.log('Firebase profile updated with displayName:', finalDisplayName);

            // Create user profile in backend with the same display name
            try {
                console.log('Creating backend profile with displayName:', finalDisplayName);
                const createdProfile = await authApi.createUserProfile({
                    uid: user.uid,
                    email: user.email!,
                    displayName: finalDisplayName,
                });
                console.log('Backend profile created:', createdProfile);
            } catch (backendError) {
                console.error("Failed to create backend profile:", backendError);
                // Continue even if backend creation fails - user can still use the app
            }
            
            // User sync happens automatically in onAuthStateChanged
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            setAuthState((prev) => ({
                ...prev,
                loading: false,
                error: getAuthErrorMessage(error.code),
            }));
        } finally {
            isSigningUp.current = false; // Clear flag
        }
    };

    const resetPassword = async (email: string) => {
        setAuthState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            await sendPasswordResetEmail(auth, email);
            setAuthState((prev) => ({ ...prev, loading: false, error: null }));
            return true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            setAuthState((prev) => ({
                ...prev,
                loading: false,
                error: getAuthErrorMessage(error.code),
            }));
            return false;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            setAuthState((prev) => ({
                ...prev,
                error: getAuthErrorMessage(error.code),
            }));
        }
    };

    const clearError = () => {
        setAuthState((prev) => ({ ...prev, error: null }));
    };

    return {
        ...authState,
        login,
        signup,
        resetPassword,
        logout,
        clearError,
    };
};

const getAuthErrorMessage = (errorCode: string): string => {
    const errorMessages: { [key: string]: string } = {
        "auth/invalid-email": "Invalid email format",
        "auth/user-disabled": "This account has been disabled",
        "auth/user-not-found": "No account found with this email",
        "auth/wrong-password": "Incorrect password",
        "auth/email-already-in-use": "Email is already in use",
        "auth/weak-password": "Password is too weak",
        "auth/network-request-failed":
            "Network error. Please check your connection.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
    };

    return errorMessages[errorCode] || "An unexpected error occurred";
};
