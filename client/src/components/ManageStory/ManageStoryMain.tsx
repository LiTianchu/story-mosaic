import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useManagedStories } from "../../hooks/useManagedStories";
import ManageStoryCard from "./ManageStoryCard";
import CreateStoryModal from "./CreateStoryModal";
import Loading from "../Common/Loading";
import Message from "../Common/Message";
import { Plus, BookPlus } from "lucide-react";

// Main component for managing user's stories
const ManageStoryMain: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { stories, loading, error, createStory, deleteStory, refreshStories } =
    useManagedStories();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleCreateStory = async (storyData: {
    title: string;
    description: string;
    tags: string[];
    imageFile?: File;
  }) => {
    try {
      setCreateLoading(true);
      setActionError(null);
      const newStory = await createStory(storyData);
      setIsCreateModalOpen(false);

      // Navigate to edit page for the new story
      handleEditStory(newStory._id);
    } catch (err) {
      console.error("Failed to create story:", err);
      setActionError(
        err instanceof Error ? err.message : "Failed to create story"
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditStory = (storyId: string) => {
    navigate(`/edit/${storyId}`);
  };

  const handleDeleteStory = async (storyId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this story? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setActionError(null);
      await deleteStory(storyId);
    } catch (err) {
      console.error("Failed to delete story:", err);
      setActionError(
        err instanceof Error ? err.message : "Failed to delete story"
      );
    }
  };

  const handleReadStory = (storyId: string) => {
    navigate(`/reader/${storyId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="h-full bg-paper py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-dark-ink mb-2">
              My Stories
            </h1>
            <p className="text-faint-ink">
              Manage your interactive stories and collaborate with others
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 border border-add-btn text-dark-ink rounded-lg hover:bg-add-btn hover:text-light-ink transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus size={20} />
            <span>Create New Story</span>
          </button>
        </div>

        {/* Error Messages */}
        {error && (
          <Message type="error" message={error} onClose={refreshStories} />
        )}
        {actionError && (
          <Message
            type="error"
            message={actionError}
            onClose={() => setActionError(null)}
          />
        )}

        {/* Stories Grid */}
        {stories.length === 0 ? (
          <div className="text-center py-16">
            <BookPlus size={64} className="text-faint-ink mx-auto mb-4" />
            <p className="text-faint-ink text-lg mb-6">No stories yet</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-8 py-3 border border-add-btn text-dark-ink rounded-lg hover:bg-add-btn hover:text-light-ink transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus size={20} />
              Create Your First Story
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {stories.map((story) => (
              <ManageStoryCard
                key={story._id}
                story={story}
                onEdit={handleEditStory}
                onDelete={handleDeleteStory}
                onRead={handleReadStory}
                isOwner={story.ownerId === user?._id}
              />
            ))}
          </div>
        )}

        {/* Create Story Modal */}
        <CreateStoryModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateStory}
          loading={createLoading}
        />
      </div>
    </div>
  );
};

export default ManageStoryMain;
