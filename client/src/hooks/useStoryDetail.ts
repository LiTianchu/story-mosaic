import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { storyApi, storyStatsApi, storyVersionApi } from "../services/api";
import type { StoryDetail, StarActionResponse } from "@app-types/data";

export const useStoryDetail = (storyId: string) => {
  const { user } = useAuth();
  const [storyDetail, setStoryDetail] = useState<StoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starLoading, setStarLoading] = useState(false);

  // Fetch story detail with all related data
  const fetchStoryDetail = useCallback(async () => {
    if (!storyId) return;

    try {
      setLoading(true);
      setError(null);

      console.log("Loading story detail for storyId:", storyId);

      // Fetch all required data in parallel
      const [storyData, starData, versions] = await Promise.all([
        storyApi.getById(storyId).catch((err) => {
          console.error("Failed to fetch story data:", err);
          throw new Error(`Failed to load story: ${err.message}`);
        }),
        user
          ? storyStatsApi
              .getStarByStoryUserId(storyId, user._id)
              .catch((err) => {
                console.warn("Failed to fetch star data:", err);
                return null;
              })
          : Promise.resolve(null),
        storyVersionApi.getByStoryId(storyId).catch((err) => {
          console.error("Failed to fetch versions:", err);
          throw new Error(`Failed to load story versions: ${err.message}`);
        }),
      ]);

      console.log("Loaded story detail:", storyData);
      console.log("Loaded story star:", starData);
      console.log("Loaded story versions:", versions);

      const isStarred = starData == null ? false : starData.isStarred;
      const currentVersion =
        versions.find((v) => v._id === storyData.publishedVersionId) ||
        versions[0];
      console.log("Determined current version:", currentVersion);

      // Build complete story detail object
      const completeStoryDetail: StoryDetail = {
        ...storyData,
        currentVersion: currentVersion,
        isStarred: isStarred,
        isOwner: user?._id == storyData.ownerId,
      };

      setStoryDetail(completeStoryDetail);
    } catch (err) {
      console.error("Failed to load story detail:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load story details"
      );
    } finally {
      setLoading(false);
    }
  }, [storyId, user]);

  // Toggle star (like) for the story
  const toggleStar = async (): Promise<StarActionResponse> => {
    if (!storyDetail || !user) {
      throw new Error("User not authenticated or story not loaded");
    }

    try {
      setStarLoading(true);
      console.log("Toggling star for story:", storyId);

      const result = await storyStatsApi.toggleStar(storyId, user._id);
      console.log("Star toggle result:", result);

      // Update local state
      const updatedStoryDetail: StoryDetail = {
        ...storyDetail,
        isStarred: result.isStarred,
      };

      setStoryDetail(updatedStoryDetail);
      return result;
    } catch (err) {
      console.error("Failed to toggle star:", err);
      throw new Error(
        err instanceof Error ? err.message : "Failed to update star status"
      );
    } finally {
      setStarLoading(false);
    }
  };

  useEffect(() => {
    fetchStoryDetail();
  }, [fetchStoryDetail, storyId]);

  const refresh = () => {
    fetchStoryDetail();
  };

  return {
    storyDetail,
    loading,
    error,
    starLoading,
    toggleStar,
    refresh,
  };
};
