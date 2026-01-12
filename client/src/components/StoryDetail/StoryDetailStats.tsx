import React from "react";
import type { StoryDetail } from "@app-types/data";

interface StoryDetailStatsProps {
  storyDetail: StoryDetail;
  onStarToggle: () => void;
  starLoading: boolean;
}

const StoryDetailStats: React.FC<StoryDetailStatsProps> = ({
  storyDetail,
  onStarToggle,
  starLoading,
}) => {
  const handleStarClick = () => {
    if (!starLoading) {
      onStarToggle();
    }
  };

  return (
    <div className="bg-paper border border-below-paper rounded-lg p-6">
      <h3 className="font-book-title text-lg text-dark-ink mb-4">
        Story Stats
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-dark-ink">
            {storyDetail.currentVersion
              ? storyDetail.currentVersion.stats.readCount.toLocaleString()
              : ""}
          </div>
          <div className="text-faint-ink text-sm">Reads</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-dark-ink">
            {storyDetail.currentVersion
              ? storyDetail.currentVersion.stats.starCount.toLocaleString()
              : ""}
          </div>
          <div className="text-faint-ink text-sm">Stars</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-xl font-bold text-dark-ink">
            {storyDetail.currentVersion
              ? storyDetail.currentVersion.stats.totalNodes
              : ""}
          </div>
          <div className="text-faint-ink text-sm">Nodes</div>
        </div>

        <div className="text-center">
          <div className="text-xl font-bold text-dark-ink">
            {storyDetail.currentVersion
              ? `v${storyDetail.currentVersion.versionNumber}`
              : ""}
          </div>
          <div className="text-faint-ink text-sm">Version</div>
        </div>
      </div>

      <button
        onClick={handleStarClick}
        disabled={starLoading}
        className={`w-full mt-4 py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer ${
          storyDetail.isStarred
            ? "bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-200"
            : "bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200"
        } ${starLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {starLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            <span>Loading...</span>
          </>
        ) : (
          <>
            <span className="text-lg">{storyDetail.isStarred ? "★" : "☆"}</span>
            <span>{storyDetail.isStarred ? "Starred" : "Star this story"}</span>
          </>
        )}
      </button>
    </div>
  );
};

export default StoryDetailStats;
