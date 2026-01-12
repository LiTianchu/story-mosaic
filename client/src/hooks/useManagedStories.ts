// useStories.ts
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { userStoriesApi, storyVersionApi, storyApi } from "../services/api";
import type {
  Story,
  StoryTag,
  StoryVersion,
  StoryWithStats,
} from "@app-types/data";

export const useManagedStories = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<StoryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's stories
  const fetchStories = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      console.log("Loading user stories for user:", user._id);

      // Fetch user stories using userStoriesApi
      const userStories: Story[] = await userStoriesApi.getMyStories(user._id);

      console.log("Loaded user stories:", userStories);

      // Fetch stats for each story
      const versionStatPromise: Promise<Partial<StoryVersion>>[] =
        userStories.map(async (story) => {
          if (story.publishedVersionId) {
            try {
              const foundVersion: Partial<StoryVersion> =
                await storyVersionApi.getById(story.publishedVersionId);
              return foundVersion;
            } catch (err) {
              console.warn(
                `Failed to fetch version for story ${story._id}:`,
                err
              );
              return {
                stats: { readCount: 0, starCount: 0 },
              } as Partial<StoryVersion>;
            }
          } else {
            return {
              stats: { readCount: 0, starCount: 0 },
            } as Partial<StoryVersion>;
          }
        });

      const versionStats: Partial<StoryVersion>[] = await Promise.all(
        versionStatPromise
      );

      console.log("Loaded user story version:", versionStats);

      // Merge stories with their stats
      const storiesWithStats: StoryWithStats[] = userStories.map(
        (story, idx) => ({
          ...story,
          stats: {
            readCount: versionStats[idx]?.stats?.readCount || 0,
            starCount: versionStats[idx]?.stats?.starCount || 0,
          },
        })
      );

      setStories(storiesWithStats);
    } catch (err) {
      console.error("Failed to load user stories:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch stories");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create a new story
  const createStory = async (storyData: {
    title: string;
    description: string;
    tags: string[];
    imageFile?: File;
  }) => {
    if (!user) throw new Error("User not authenticated");

    try {
      console.log("Creating new story:", storyData);
      const storyPayload = {
        ownerId: user._id,
        title: storyData.title.trim(),
        description: storyData.description.trim(),
        tags: storyData.tags as StoryTag[],
        contributors: [{ userId: user._id, joinedAt: new Date() }],
      };
      console.log("Sending story payload:", storyPayload);

      const newStory = await userStoriesApi.createStory(storyPayload);
      console.log("Created new story:", newStory);

      // Upload cover image if provided
      if (storyData.imageFile) {
        try {
          const coverResult = await storyApi.uploadCover(
            newStory._id,
            storyData.imageFile
          );
          console.log("Uploaded cover image:", coverResult);

          // Use the correct field name from the API response
          const imageUrl = coverResult.imageUrl || coverResult.coverUrl;
          if (imageUrl) {
            await storyApi.update(newStory._id, { image: imageUrl });
          }
        } catch (uploadError) {
          console.error("Failed to upload cover image:", uploadError);
          // Continue even if image upload fails
        }
      }

      await fetchStories();
      return newStory;
    } catch (err) {
      console.error("Failed to create story:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create story";
      console.error("Full error details:", err);
      throw new Error(errorMessage);
    }
  };

  // Delete a story
  const deleteStory = async (storyId: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      console.log("Deleting story:", storyId);

      await userStoriesApi.deleteStory(storyId, user._id);
      await fetchStories();

      console.log("Successfully deleted story:", storyId);
    } catch (err) {
      console.error("Failed to delete story:", err);
      throw new Error(
        err instanceof Error ? err.message : "Failed to delete story"
      );
    }
  };

  // Refresh stories
  const refreshStories = () => {
    fetchStories();
  };

  useEffect(() => {
    fetchStories();
  }, [fetchStories, user]);

  return {
    stories,
    loading,
    error,
    createStory,
    deleteStory,
    refreshStories,
  };
};
