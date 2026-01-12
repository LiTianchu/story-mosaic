import React from "react";
import type { StoryTag, StoryWithStats } from "@app-types/data";
import { STORY_TAG_LABELS_DICT } from "@/constants/storyTags";
import TagChip from "@components/Common/TagChip";
import { BookOpen, Edit, Trash2, Star, Eye, Users, Plus } from "lucide-react";

interface ManageStoryCardProps {
  story: StoryWithStats;
  onEdit: (storyId: string) => void;
  onDelete: (storyId: string) => void;
  onRead: (storyId: string) => void;
  isOwner: boolean;
}

// Card component for managing a story in the user's dashboard
const ManageStoryCard: React.FC<ManageStoryCardProps> = ({
  story,
  onEdit,
  onDelete,
  onRead,
  isOwner,
}) => {
  return (
    <div className="flex flex-col justify-between h-full border border-dark-ink rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      <div>
        {/* Story Cover Image */}
        <div className="h-40 bg-gray-200 overflow-hidden">
          {story.image ? (
            <img
              src={story.image}
              alt={story.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-add-btn to-secondary-btn flex items-center justify-center">
              <span className="text-white text-lg font-book-title">
                No Cover Image
              </span>
            </div>
          )}
        </div>
        <div className="p-4">
          {/* Header with title and status */}
          <div className="flex flex-row justify-between items-center">
            <h3 className="font-book-title text-lg text-gray-900 line-clamp-2 flex-1 mr-2">
              {story.title}
            </h3>
            <span
              className={`px-2 py-1 rounded-lg text-xs font-semibold border ${
                isOwner
                  ? "bg-green-100 text-green-800 border-green-300"
                  : "bg-gray-100 text-gray-800 border-gray-300"
              }`}
            >
              {isOwner ? "Owner" : "Contributor"}
            </span>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
            {story.description}
          </p>
        </div>
      </div>
      <div className="px-4 pb-4">
        {/* Tags */}
        {story.tags && story.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mb-3">
            {story.tags.slice(0, 2).map((tag: StoryTag, index) => (
              <TagChip
                key={index}
                label={STORY_TAG_LABELS_DICT[tag]}
                active={false}
              />
            ))}
            {story.tags.length > 2 && (
              <span className="flex items-center gap-1 px-4 py-1.5 rounded-full font-medium border border-gray-300 text-gray-600">
                <Plus size={12} />
                {story.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-3">
            {story.stats && (
              <>
                <span className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-500" />{" "}
                  {story.stats.starCount}
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={14} className="text-blue-500" />{" "}
                  {story.stats.readCount}
                </span>
              </>
            )}
          </div>
          <span className="flex items-center gap-1">
            <Users size={14} className="text-green-500" />{" "}
            {story.contributors.length}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            title="Read Story"
            onClick={() => onRead(story._id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-add-btn text-white rounded-lg text-sm transition-colors font-semibold cursor-pointer"
          >
            <BookOpen size={16} /> Read
          </button>
          <button
            title="Edit Story"
            onClick={() => onEdit(story._id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary-btn text-white rounded-lg text-sm transition-colors font-semibold cursor-pointer"
          >
            <Edit size={16} /> Edit
          </button>
          <button
            onClick={() => onDelete(story._id)}
            title={isOwner ? "Delete Story" : "You are not the owner"}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-danger text-white rounded-lg text-sm  disabled:bg-gray-400 transition-colors font-semibold cursor-pointer disabled:cursor-not-allowed"
            disabled={!isOwner}
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageStoryCard;
