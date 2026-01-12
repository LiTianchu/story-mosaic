import React from "react";
import { useEffect, useState, useCallback } from "react";
import type { Story } from "@app-types/data";
import type { EditedStory, RecentStory } from "@app-types/data";
import { useNavigate } from "react-router-dom";
import { storyApi } from "../../services/api";

interface StoryListProps {
  title: string;
  stories: EditedStory[] | RecentStory[];
  type: "read" | "edited";
  emptyMessage: string;
}

const StoryList: React.FC<StoryListProps> = ({
  title,
  stories,
  type,
  emptyMessage,
}) => {
  const navigate = useNavigate();
  const [fetchedStories, setFetchedStories] = useState<Story[]>([]);

  const handleStoryClick = (storyId: string) => {
    if (type === "read") {
      navigate(`/reader/${storyId}`);
    } else {
      navigate(`/edit/${storyId}`);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const loadData = useCallback(async () => {
    const loaded: (Story | null)[] = await Promise.all(
      stories.map(async (stry) => {
        try {
          return await storyApi.getById(stry.storyId);
        } catch (err) {
          console.warn(`Failed to fetch story ${stry.storyId}:`, err);
          return null;
        }
      })
    );
    setFetchedStories(loaded.filter((s): s is Story => s !== null));
  }, [stories]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (stories.length === 0) {
    return (
      <div className="bg-paper border border-below-paper rounded-lg p-6">
        <h3 className="font-book-title text-lg text-dark-ink mb-4">{title}</h3>
        <p className="text-faint-ink text-center py-4">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-paper border border-below-paper rounded-lg p-6">
      <h3 className="font-book-title text-lg text-dark-ink mb-4">{title}</h3>
      <div className="space-y-4">
        {fetchedStories.slice(0, 20).map((story, index) => (
          <div
            key={story._id}
            className="flex items-center gap-4 p-3 hover:bg-below-paper rounded-lg transition-colors cursor-pointer group"
            onClick={() => handleStoryClick(story._id)}
          >
            {/* Story Cover Image */}
            <div className="flex-shrink-0 w-32 h-16 bg-gray-200 rounded-lg overflow-hidden">
              {story.image ? (
                <img
                  src={story.image}
                  alt={story.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-add-btn to-secondary-btn flex items-center justify-center">
                  <span className="text-white text-sm">No Cover Image</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-dark-ink font-medium truncate group-hover:text-add-btn transition-colors">
                {story.title}
              </h4>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-faint-ink">
                  {type === "read" ? "Read" : "Edited"}{" "}
                  {formatDate(
                    type === "read"
                      ? (stories[index] as RecentStory).lastAccessedAt
                      : (stories[index] as EditedStory).lastEditedAt
                  )}
                </span>
              </div>
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-add-btn text-sm font-medium">
                {type === "read" ? "Read →" : "Edit →"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoryList;
