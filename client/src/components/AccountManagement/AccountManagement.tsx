import React, { Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@hooks/useUser";
import StoryList from "./StoryList";
import ProfileEditor from "./ProfileEditor";
import Loading from "../Common/Loading";
import Message from "../Common/Message";

const AccountManagement: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, loading, error, updateProfile, logout, refreshData } =
    useUser();

  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleWorkspaceClick = () => {
    navigate("/managestory");
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      try {
        await logout();
        navigate("/auth");
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "Failed to log out"
        );
      }
    }
  };

  const handleProfileSave = async (updates: {
    displayName: string;
    bio: string;
    avatarFile?: File | null;
  }) => {
    try {
      setActionError(null);
      return await updateProfile(updates);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update profile"
      );
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <p className="text-faint-ink text-lg">Unable to load profile</p>
          <button
            onClick={refreshData}
            className="mt-4 px-4 py-2 bg-add-btn text-light-ink rounded-md hover:bg-opacity-90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-paper py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error Messages */}
        {error && (
          <Message type="error" message={error} onClose={refreshData} />
        )}
        {actionError && (
          <Message
            type="error"
            message={actionError}
            onClose={() => setActionError(null)}
          />
        )}

        {/* Header Section */}
        <div className="bg-paper border border-below-paper rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-below-paper flex items-center justify-center bg-add-btn text-light-ink text-xl font-semibold">
                {userProfile.avatarImage &&
                userProfile.avatarImage.trim().length > 0 ? (
                  <img
                    src={userProfile.avatarImage}
                    alt={userProfile.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userProfile.displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h1 className="font-book-title text-2xl text-dark-ink">
                  {userProfile.displayName}
                </h1>
                <p className="text-faint-ink">{userProfile.email}</p>
                <p className="text-faint-ink text-sm mt-1">{userProfile.bio}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setIsProfileEditorOpen(true)}
                className="px-4 py-2 bg-secondary-btn text-light-ink rounded-md hover:bg-opacity-90 transition-colors text-sm cursor-pointer"
              >
                Edit Profile
              </button>
              <button
                onClick={handleWorkspaceClick}
                className="px-4 py-2 bg-add-btn text-light-ink rounded-md hover:bg-opacity-90 transition-colors text-sm cursor-pointer"
              >
                Workspace
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-danger text-light-ink rounded-md hover:bg-opacity-90 transition-colors text-sm cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Suspense fallback={<Loading />}>
            <StoryList
              title="Recently Read"
              stories={userProfile.recentStories}
              type="read"
              emptyMessage="You haven't read any stories yet"
            />
          </Suspense>

          <Suspense fallback={<Loading />}>
            <StoryList
              title="Recently Edited"
              stories={userProfile.editedStories}
              type="edited"
              emptyMessage="You haven't edited any stories yet"
            />
          </Suspense>
        </div>

        {/* Profile Editor Modal */}
        <ProfileEditor
          profile={userProfile}
          isOpen={isProfileEditorOpen}
          onClose={() => setIsProfileEditorOpen(false)}
          onSave={handleProfileSave}
        />
      </div>
    </div>
  );
};

export default AccountManagement;
