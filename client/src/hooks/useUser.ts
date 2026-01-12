import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { userApi } from '../services/api';
import type { UserProfile } from '@app-types/data';

export const useUser = () => {
    const { user, logout } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch user profile and activity data
    const fetchUserData = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);

            console.log("Loading user data for user:", user._id);

            // Fetch all user data in parallel
            const [userData] = await Promise.all([
                userApi.getUserById(user._id),
            ]);

            console.log("Loaded user profile:", userData);

            setUserProfile(userData);
        } catch (err) {
            console.error("Failed to load user data:", err);
            setError(err instanceof Error ? err.message : 'Failed to load user data');
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Update user profile
    const updateProfile = async (
        updates: { displayName: string; bio: string; avatarFile?: File | null },
    ) => {
        if (!user) throw new Error('User not authenticated');

        try {
            const { avatarFile, ...profileUpdates } = updates;
            console.log("Updating user profile:", profileUpdates);

            const updatedProfile = await userApi.updateUser(user._id, profileUpdates);

            let finalProfile = updatedProfile;

            if (avatarFile) {
                try {
                    console.log("Uploading avatar image");
                    const { avatarUrl, user: updatedUserFromUpload } = await userApi.uploadAvatar(user._id, avatarFile);
                    finalProfile = updatedUserFromUpload ?? { ...updatedProfile, avatarImage: avatarUrl };
                } catch (uploadError) {
                    console.error("Avatar upload failed:", uploadError);
                    setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload avatar');
                    // Still return base profile updates
                    setUserProfile(updatedProfile);
                    return false;
                }
            }

            setUserProfile(finalProfile);

            console.log("Successfully updated user profile");
            return true;
        } catch (err) {
            console.error("Failed to update profile:", err);
            setError(err instanceof Error ? err.message : 'Failed to update profile');
            return false;
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData, user]);

    const refreshData = () => {
        fetchUserData();
    };

    return {
        userProfile,
        loading,
        error,
        updateProfile,
        logout,
        refreshData
    };
};
