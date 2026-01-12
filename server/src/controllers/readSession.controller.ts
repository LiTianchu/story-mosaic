import { asyncHandler } from "../utils/asyncHandler.js";
import { ReadSession } from "../models/readSession.model.js";
import { User } from "../models/user.model.js";
import { StoryVersion } from "../models/storyVersion.model.js";
import { Story } from "../models/story.model.js";
import { ApiError } from "../utils/apiError.js";

export const getReadSession = asyncHandler(async (req, res) => {
  const { userId, storyVersionId } = req.query;
  if (!userId || !storyVersionId) {
    throw new ApiError(400, "userId and storyVersionId are required");
  }
  const readSession = await ReadSession.findOne({ userId, storyVersionId });
  res.status(200).json(readSession);
});

export const createReadSession = asyncHandler(async (req, res) => {
  const { userId, storyVersionId, currentNodeId } = req.body;
  if (!userId || !storyVersionId || !currentNodeId) {
    throw new ApiError(
      400,
      "userId, storyVersionId, and currentNodeId are required"
    );
  }
  const readSession = await ReadSession.create({
    userId,
    storyVersionId,
    currentNodeId,
    history: [currentNodeId],
  });

  // Update user's recentStories array
  try {
    const storyVersion = await StoryVersion.findById(storyVersionId);
    if (storyVersion) {
      const story = await Story.findById(storyVersion.storyId);
      if (story) {
        const storyIdStr = storyVersion.storyId.toString();
        await User.findByIdAndUpdate(userId, {
          $pull: { recentStories: { storyId: storyIdStr } },
        });
        await User.findByIdAndUpdate(userId, {
          $push: {
            recentStories: {
              $each: [
                {
                  storyId: storyIdStr,
                  lastAccessedAt: new Date(),
                },
              ],
              $position: 0,
              $slice: 20, // Keep only the 20 most recent
            },
          },
        });
      }
    }
  } catch (error) {
    console.error("Error updating user recentStories:", error);
  }

  res.status(201).json(readSession);
});

export const updateReadSession = asyncHandler(async (req, res) => {
  const { userId, storyVersionId, currentNodeId } = req.body;
  if (!userId || !storyVersionId || !currentNodeId) {
    throw new ApiError(
      400,
      "userId, storyVersionId, and currentNodeId are required"
    );
  }
  const readSession = await ReadSession.findOneAndUpdate(
    { userId, storyVersionId },
    { currentNodeId, $push: { history: currentNodeId } },
    { new: true, upsert: true }
  );
  res.status(200).json(readSession);
});

export const deleteReadSession = asyncHandler(async (req, res) => {
  const { userId, storyVersionId } = req.body;
  if (!userId || !storyVersionId) {
    throw new ApiError(400, "userId and storyVersionId are required");
  }
  const result = await ReadSession.deleteOne({ userId, storyVersionId });
  if (result.deletedCount === 0) {
    throw new ApiError(404, "Read session not found");
  }
  res.status(204).send();
});
