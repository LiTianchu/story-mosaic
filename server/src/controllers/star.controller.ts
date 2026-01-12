import { asyncHandler } from "../utils/asyncHandler.js";
import { Star } from "../models/star.model.js";
import { ApiError } from "../utils/apiError.js";

export const toggleStar = asyncHandler(async (req, res) => {
  const { storyId } = req.params;
  const { userId } = req.body;
  if (!userId || !storyId) {
    throw new ApiError(400, "userId and storyId are required");
  }
  const existingStar = await Star.findOne({ userId, storyId });
  if (existingStar) {
    await Star.deleteOne({ userId, storyId });
    res.status(200).json({ message: "Star removed", isStarred: false });
  } else {
    await Star.create({ userId, storyId });
    res.status(201).json({ message: "Star added", isStarred: true });
  }
});

export const getStarByStoryAndUserId = asyncHandler(async (req, res) => {
  const { storyId, userId } = req.params;
  const star = await Star.findOne({ userId, storyId });
  res.status(200).json({ isStarred: !!star, star });
});
