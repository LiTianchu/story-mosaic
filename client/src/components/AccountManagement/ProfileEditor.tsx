import React, { useState, useEffect } from "react";
import type { UserProfile } from "@app-types/data";
import Message from "../Common/Message";

interface ProfileEditorProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: {
    displayName: string;
    bio: string;
    avatarFile?: File | null;
  }) => Promise<boolean>;
  loading?: boolean;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({
  profile,
  isOpen,
  onClose,
  onSave,
  // loading = false
}) => {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [error, setError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const initialAvatar =
    profile.avatarImage && profile.avatarImage.trim().length > 0
      ? profile.avatarImage
      : null;
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialAvatar
  );

  useEffect(() => {
    if (isOpen) {
      setDisplayName(profile.displayName);
      setBio(profile.bio);
      setError(null);
      setAvatarFile(null);
      setAvatarPreview(
        profile.avatarImage && profile.avatarImage.trim().length > 0
          ? profile.avatarImage
          : null
      );
    }
  }, [isOpen, profile]);

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      setError("Display name is required");
      return;
    }

    try {
      setSaveLoading(true);
      setError(null);

      const success = await onSave({
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarFile,
      });

      if (success) {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-ink/40 p-4">
      <div className="bg-paper rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-below-paper">
          <h2 className="font-book-title text-xl text-dark-ink">
            Edit Profile
          </h2>
          <button
            onClick={handleClose}
            className="text-faint-ink hover:text-dark-ink transition-colors text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <Message
              type="error"
              message={error}
              onClose={() => setError(null)}
            />
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-ink">
              Profile Image
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border border-below-paper overflow-hidden flex items-center justify-center bg-below-paper">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold text-faint-ink">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-below-paper px-3 py-2 text-dark-ink hover:border-add-btn">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  Upload Image
                </label>
                <p className="text-xs text-faint-ink">
                  Recommended square image, max 2MB.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-dark-ink mb-1"
            >
              Display Name *
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-below-paper rounded-md focus:outline-none focus:ring-2 focus:ring-add-btn focus:border-transparent bg-paper"
              placeholder="Enter your display name..."
              maxLength={50}
              required
            />
            <p className="text-xs text-faint-ink mt-1">
              {displayName.length}/50 characters
            </p>
          </div>

          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-dark-ink mb-1"
            >
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-below-paper rounded-md focus:outline-none focus:ring-2 focus:ring-add-btn focus:border-transparent bg-paper resize-none"
              placeholder="Tell us about yourself..."
              maxLength={200}
            />
            <p className="text-xs text-faint-ink mt-1">
              {bio.length}/200 characters
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-faint-ink hover:text-dark-ink transition-colors cursor-pointer"
              disabled={saveLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveLoading || !displayName.trim()}
              className="px-4 py-2 text-sm font-medium text-light-ink bg-add-btn rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {saveLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditor;
