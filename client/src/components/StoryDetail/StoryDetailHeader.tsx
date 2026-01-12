// StoryDetailHeader.tsx
import React from "react";
import type { StoryDetail } from "@app-types/data";
import { BookOpen, Edit } from "lucide-react";

interface StoryDetailHeaderProps {
  storyDetail: StoryDetail;
  onRead: () => void;
  onContribute: () => void;
}

const StoryDetailHeader: React.FC<StoryDetailHeaderProps> = ({
  storyDetail,
  onRead,
  onContribute,
}) => {
  return (
    <div className="bg-paper border border-below-paper rounded-lg overflow-hidden mb-6">
      {/* Hero Section with Cover Image */}
      <div className="relative h-64 bg-gray-200">
        {storyDetail.image ? (
          <img
            src={storyDetail.image}
            alt={storyDetail.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-add-btn to-secondary-btn flex items-center justify-center">
            <span className="text-white text-4xl">No Cover Image</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h1 className="font-book-title text-3xl mb-2 drop-shadow-md">
            {storyDetail.title}
          </h1>
          <p className="text-white text-opacity-90 drop-shadow-sm">
            An interactive story by the community
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRead}
            className="px-6 py-3 bg-add-btn text-light-ink rounded-lg hover:bg-opacity-90 transition-colors font-body font-semibold shadow-sm cursor-pointer"
          >
            <BookOpen className="inline-block mr-2" />
            Read Story
          </button>

          <button
            onClick={onContribute}
            className={
              "px-6 py-3 bg-secondary-btn text-light-ink rounded-lg transition-colors font-body font-semibold shadow-sm hover:bg-opacity-90 cursor-pointer"
            }
          >
            <Edit className="inline-block mr-2" />
            Contribute
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryDetailHeader;
