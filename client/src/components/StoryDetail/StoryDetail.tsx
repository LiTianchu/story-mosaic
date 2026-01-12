import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStoryDetail } from "@hooks/useStoryDetail";
import StoryDetailHeader from "./StoryDetailHeader";
import StoryDetailInfo from "./StoryDetailInfo";
import StoryDetailStats from "./StoryDetailStats";
import Loading from "../Common/Loading";
import Message from "../Common/Message";
import type { StoryVersion } from "@/types/data";

// Main component for displaying detailed information about a story
const StoryDetail: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { storyDetail, loading, error, starLoading, toggleStar, refresh } =
    useStoryDetail(storyId || "");

  const [actionError, setActionError] = useState<string | null>(null);

  const handleRead = () => {
    if (storyDetail) {
      navigate(`/reader/${storyDetail._id}`);
    }
  };

  console.log("Rendering StoryDetail for storyId:", storyId);
  const handleContribute = async () => {
    if (!storyDetail) return;
    navigate(`/edit/${storyDetail._id}`);
  };

  const handleStarToggle = async () => {
    try {
      setActionError(null);
      await toggleStar();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update star status"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error || !storyDetail) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <p className="text-faint-ink text-lg mb-4">
            {error || "Story not found"}
          </p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-add-btn text-light-ink rounded-md hover:bg-opacity-90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const safeStoryDetail = {
    ...storyDetail,
    currentVersion:
      storyDetail.currentVersion ||
      ({
        _id: "",
        storyId: storyDetail._id,
        versionNumber: 1,
        nodeIds: [],
        rootNodeId: "",
        stats: {
          totalNodes: 0,
          readCount: 0,
          starCount: 0,
        },
        publishedAt: new Date(),
        publishedBy: storyDetail.ownerId,
        createdBy: storyDetail.ownerId,
        updatedBy: storyDetail.ownerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as StoryVersion),
    isStarred: storyDetail.isStarred || false,
    isOwner: storyDetail.isOwner || false,
  };

  return (
    <div className="h-full bg-paper py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error Messages */}
        {actionError && (
          <Message
            type="error"
            message={actionError}
            onClose={() => setActionError(null)}
          />
        )}

        {/* Header with Title and Action Buttons */}
        <StoryDetailHeader
          storyDetail={safeStoryDetail}
          onRead={handleRead}
          onContribute={handleContribute}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Story Information */}
          <div className="lg:col-span-2">
            <StoryDetailInfo storyDetail={safeStoryDetail} />
          </div>

          {/* Right Column - Stats and Actions */}
          <div className="lg:col-span-1">
            <StoryDetailStats
              storyDetail={safeStoryDetail}
              onStarToggle={handleStarToggle}
              starLoading={starLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryDetail;
