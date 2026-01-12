import { asyncHandler } from "../utils/asyncHandler.js";
import { NodeLock } from "../models/nodeLock.model.js";
import { ApiError } from "../utils/apiError.js";

// Not really used in the current implementation of locking but set up for future use
export const getNodeLock = asyncHandler(async (req, res) => {
  const { versionId, nodeId } = req.query;
  if (!versionId || !nodeId) {
    throw new ApiError(400, "versionId and nodeId are required");
  }
  const nodeLock = await NodeLock.findOne({
    storyVersionId: versionId,
    nodeId,
  });
  res.status(200).json(nodeLock);
});

export const createNodeLock = asyncHandler(async (req, res) => {
  const { storyVersionId, nodeId, lockedBy } = req.body;
  if (!storyVersionId || !nodeId || !lockedBy) {
    throw new ApiError(
      400,
      "storyVersionId, nodeId, and lockedBy are required"
    );
  }
  try {
    const nodeLock = await NodeLock.create({
      storyVersionId,
      nodeId,
      lockedBy,
    });
    res.status(201).json(nodeLock);
  } catch (error: any) {
    if (error.code === 11000) {
      throw new ApiError(409, "Node is already locked");
    }
    throw error;
  }
});

export const updateNodeLock = asyncHandler(async (req, res) => {
  const { storyVersionId, nodeId, lockedBy } = req.body;
  if (!storyVersionId || !nodeId || !lockedBy) {
    throw new ApiError(
      400,
      "storyVersionId, nodeId, and lockedBy are required"
    );
  }
  const nodeLock = await NodeLock.findOneAndUpdate(
    { storyVersionId, nodeId },
    { lockedBy, lockedAt: new Date() },
    { new: true }
  );
  if (!nodeLock) {
    throw new ApiError(404, "Node lock not found");
  }
  res.status(200).json(nodeLock);
});

export const deleteNodeLock = asyncHandler(async (req, res) => {
  const { storyVersionId, nodeId } = req.body;
  if (!storyVersionId || !nodeId) {
    throw new ApiError(400, "storyVersionId and nodeId are required");
  }
  const result = await NodeLock.deleteOne({ storyVersionId, nodeId });
  if (result.deletedCount === 0) {
    throw new ApiError(404, "Node lock not found");
  }
  res.status(204).send();
});
