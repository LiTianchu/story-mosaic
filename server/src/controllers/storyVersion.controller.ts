import { asyncHandler } from "../utils/asyncHandler.js";
import { StoryVersion } from "../models/storyVersion.model.js";
import { StoryNode } from "../models/storyNode.model.js";
import type { StoryNodeDocument } from "../models/storyNode.model.js";
import { Star } from "../models/star.model.js";
import { ApiError } from "../utils/apiError.js";
import { Types } from "mongoose";

const addStatsToVersion = async (version: any) => {
  const starCount = await Star.countDocuments({ storyId: version.storyId });
  const totalNodes = version.nodeIds.length;
  return {
    ...version.toObject(),
    stats: {
      totalNodes,
      readCount: version.readCount,
      starCount,
    },
  };
};

export const createStoryVersion = asyncHandler(async (req, res) => {
  const storyVersion = await StoryVersion.create(req.body);
  const versionWithStats = await addStatsToVersion(storyVersion);
  res.status(201).json(versionWithStats);
});

export const getStoryVersionById = asyncHandler(async (req, res) => {
  const storyVersion = await StoryVersion.findById(req.params.id);
  if (!storyVersion) {
    throw new ApiError(404, "Story version not found");
  }
  const versionWithStats = await addStatsToVersion(storyVersion);
  res.status(200).json(versionWithStats);
});

export const updateStoryVersion = asyncHandler(async (req, res) => {
  // TODO: Other fields need to be updated also need to have proper handling
  const { rootNodeId, isPublished } = req.body;

  const updateData: any = {};
  if (rootNodeId !== undefined) updateData.rootNodeId = rootNodeId;
  if (isPublished !== undefined) updateData.isPublished = isPublished;

  const storyVersion = await StoryVersion.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true },
  );

  if (!storyVersion) {
    throw new ApiError(404, "Story version not found");
  }

  const versionWithStats = await addStatsToVersion(storyVersion);
  res.status(200).json(versionWithStats);
});

export const listStoryVersions = asyncHandler(async (req, res) => {
  const storyId = req.params.storyId;

  const storyVersions = await StoryVersion.find({
    storyId: storyId,
  });

  const versionsWithStats = await Promise.all(
    storyVersions.map((version) => addStatsToVersion(version)),
  );

  res.status(200).json(versionsWithStats);
});

export const getDraftVersionByStoryId = asyncHandler(async (req, res) => {
  const storyId = req.params.storyId;

  const draftVersion = await StoryVersion.findOne({
    storyId: storyId,
    isPublished: false,
  }).sort({ versionNumber: -1 }); // Get the latest draft

  if (!draftVersion) {
    throw new ApiError(404, "No draft version found for this story");
  }

  const versionWithStats = await addStatsToVersion(draftVersion);
  res.status(200).json(versionWithStats);
});

export const addNodeIdToStoryVersion = asyncHandler(async (req, res) => {
  const { nodeId } = req.body;
  const storyVersion = await StoryVersion.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { nodeIds: nodeId } },
    { new: true },
  );
  if (!storyVersion) {
    throw new ApiError(404, "Story version not found");
  }
  const versionWithStats = await addStatsToVersion(storyVersion);
  res.status(200).json(versionWithStats);
});

export const deleteNodeIdFromStoryVersion = asyncHandler(async (req, res) => {
  const { nodeId } = req.body;
  const storyVersion = await StoryVersion.findByIdAndUpdate(
    req.params.id,
    { $pull: { nodeIds: nodeId } },
    { new: true },
  );
  if (!storyVersion) {
    throw new ApiError(404, "Story version not found");
  }
  const versionWithStats = await addStatsToVersion(storyVersion);
  res.status(200).json(versionWithStats);
});

export const incrementStoryVersionReadCount = asyncHandler(async (req, res) => {
  const storyVersion = await StoryVersion.findByIdAndUpdate(
    req.params.id,
    { $inc: { readCount: 1 } },
    { new: true },
  );
  if (!storyVersion) {
    throw new ApiError(404, "Story version not found");
  }
  const versionWithStats = await addStatsToVersion(storyVersion);
  res.status(200).json(versionWithStats);
});

export const cloneStoryVersion = asyncHandler(async (req, res) => {
  const originalVersion = await StoryVersion.findById(req.params.id).lean();
  if (!originalVersion) {
    throw new ApiError(404, "Story version not found");
  }

  const { _id, createdAt, updatedAt, nodeIds, ...versionData } =
    originalVersion;

  // First, create the new version to get its ID
  // Preserve readCount from the original version when cloning
  const newVersion = await StoryVersion.create({
    ...versionData,
    nodeIds: [], // Will be populated as we clone nodes
    rootNodeId: null, // Will be set after cloning
    versionNumber: originalVersion.versionNumber + 1,
    isPublished: false,
    readCount: originalVersion.readCount || 0, // Inherit read count from previous version
  });

  // Fetch ALL nodes that belong to this version from the database
  // (don't rely on nodeIds array which might be outdated)
  const originalNodes = await StoryNode.find({
    storyId: originalVersion.storyId,
    versionId: String(originalVersion._id),
  }).lean();

  console.log(`Cloning ${originalNodes.length} nodes from version ${originalVersion._id} to version ${newVersion._id}`);

  // Create a mapping of old node IDs to new node IDs
  const nodeIdMap = new Map<string, Types.ObjectId>();
  const newNodeIds: Types.ObjectId[] = [];

  // Clone all nodes with the new versionId
  for (const originalNode of originalNodes) {

    const {
      _id: oldId,
      createdAt,
      updatedAt,
      ...originalNodeData
    } = originalNode;
    const newNode = await StoryNode.create({
      ...originalNodeData,
      versionId: String(newVersion._id), // Set the new version ID immediately
      parentNodeIds: [], // Will update in next pass
      targetNodeIds: [], // Will update in next pass
    });

    nodeIdMap.set(oldId.toString(), newNode._id as Types.ObjectId);
    newNodeIds.push(newNode._id as Types.ObjectId);
  }

  // Update all node references
  for (const newNodeId of newNodeIds) {
    const newNode = await StoryNode.findById(newNodeId);
    if (!newNode) continue;

    const originalNodeId = Array.from(nodeIdMap.entries()).find(([_, newId]) =>
      newId.equals(newNodeId),
    )?.[0];
    if (!originalNodeId) continue;

    const originalNode = await StoryNode.findById(originalNodeId).lean();
    if (!originalNode) continue;

    newNode.parentNodeIds = originalNode.parentNodeIds.map(
      (id) => nodeIdMap.get(id.toString()) || id,
    );
    newNode.targetNodeIds = originalNode.targetNodeIds.map(
      (id) => nodeIdMap.get(id.toString()) || id,
    );

    await newNode.save();
  }

  // Handle rootNodeId - if the original version has a rootNodeId, update it to the new cloned node
  let newRootNodeId = null;
  if (originalVersion.rootNodeId) {
    const newRootId = nodeIdMap.get(originalVersion.rootNodeId.toString());
    if (newRootId) {
      newRootNodeId = newRootId.toString();
    }
  }

  // Update the new version with the node IDs and rootNodeId
  newVersion.nodeIds = newNodeIds;
  newVersion.rootNodeId = newRootNodeId;
  await newVersion.save();

  const versionWithStats = await addStatsToVersion(newVersion);
  res.status(201).json(versionWithStats);
});
