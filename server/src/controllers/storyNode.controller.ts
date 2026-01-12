import type { RequestHandler } from "express";
import { isValidObjectId, Types } from "mongoose";
import type { FilterQuery } from "mongoose";
import { Story } from "../models/story.model.js";
import { StoryVersion } from "../models/storyVersion.model.js";
import { User } from "../models/user.model.js";
import {
  StoryNode,
  type StoryNodeDocument,
  type StoryNodeType,
  type StoryNodeSerialized,
} from "../models/storyNode.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { Server } from "socket.io";

// Helper function to serialize StoryNode document for socket emission
export const serializeStoryNode = (node: any): StoryNodeSerialized => {
  return {
    _id: node._id.toString(),
    storyId: node.storyId.toString(),
    versionId: node.versionId,
    type: node.type,
    parentNodeIds: node.parentNodeIds.map((id: Types.ObjectId) =>
      id.toString()
    ),
    targetNodeIds: node.targetNodeIds.map((id: Types.ObjectId) =>
      id.toString()
    ),
    positionOnFlowchart: node.positionOnFlowchart,
    activeContributors: node.activeContributors,
    chapterTitle: node.chapterTitle,
    content: node.content,
    createdBy: node.createdBy,
    updatedBy: node.updatedBy,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
  };
};

const ensureValidId = (value: string, label: string) => {
  if (!isValidObjectId(value)) {
    throw new ApiError(400, `${label} is not a valid identifier`);
  }
};

const ensureStoryExists = async (storyId: string) => {
  const exists = await Story.exists({ _id: storyId });
  if (!exists) {
    throw new ApiError(404, "Story not found");
  }
};

const parseIdArray = (value: unknown, label: string): string[] => {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new ApiError(400, `${label} must be an array of identifiers`);
  }

  const normalized = value.map((raw) => {
    if (typeof raw !== "string") {
      throw new ApiError(400, `${label} entries must be strings`);
    }
    const trimmed = raw.trim();
    if (!trimmed.length) {
      throw new ApiError(400, `${label} entries cannot be empty`);
    }
    ensureValidId(trimmed, label);
    return trimmed;
  });

  return Array.from(new Set(normalized));
};

export const createStoryNode: RequestHandler = asyncHandler(
  async (req, res) => {
    const { storyId } = req.params as { storyId: string };
    ensureValidId(storyId, "storyId");
    await ensureStoryExists(storyId);

    const { type, content, createdBy } = req.body as {
      type?: StoryNodeType;
      content?: { text?: string };
      createdBy?: string;
    };

    if (!type || !["paragraph", "option"].includes(type)) {
      throw new ApiError(400, 'type must be either "paragraph" or "option"');
    }

    if (!content?.text?.trim()) {
      throw new ApiError(400, "content.text is required");
    }

    if (!createdBy?.trim()) {
      throw new ApiError(400, "createdBy is required");
    }

    const parentNodeIds = parseIdArray(
      req.body.parentNodeIds ??
        (req.body.parentNodeId ? [req.body.parentNodeId] : undefined),
      "parentNodeIds"
    );

    const targetNodeIds = parseIdArray(
      req.body.targetNodeIds ??
        (req.body.targetNodeId ? [req.body.targetNodeId] : undefined),
      "targetNodeIds"
    );

    const payload = {
      storyId,
      versionId: req.body.versionId ?? null,
      type,
      parentNodeIds,
      targetNodeIds,
      positionOnFlowchart: req.body.positionOnFlowchart ?? { x: 0, y: 0 },
      chapterTitle: req.body.chapterTitle ?? null,
      content: { text: content.text.trim() },
      createdBy: createdBy.trim(),
      updatedBy: (req.body.updatedBy ?? createdBy).trim(),
    };

    const node = await StoryNode.create(payload);

    const serializedNode = serializeStoryNode(node);
    emitNodeCreated(req.app.get("io"), storyId, serializedNode);
    res.status(201).json(node);
  }
);
export const emitNodeCreated = (
  io: Server,
  storyId: string,
  node: StoryNodeSerialized
) => {
  io.to(storyId).emit("node-created", node);
  console.log(`Emitted node-created to room ${storyId}:`, node._id);
};

export const listStoryNodes: RequestHandler = asyncHandler(async (req, res) => {
  const { storyId } = req.params as { storyId: string };
  ensureValidId(storyId, "storyId");
  await ensureStoryExists(storyId);

  const { parentNodeId, type, versionId } = req.query as {
    parentNodeId?: string;
    type?: StoryNodeType;
    versionId?: string;
  };

  const filter: FilterQuery<StoryNodeDocument> = { storyId };

  // CRITICAL: Filter by versionId to avoid mixing nodes from different versions
  if (versionId) {
    ensureValidId(versionId, "versionId");
    filter.versionId = versionId;
  }

  if (parentNodeId) {
    ensureValidId(parentNodeId, "parentNodeId");
    filter.parentNodeIds = parentNodeId;
  }

  if (type) {
    filter.type = type;
  }

  const nodes = await StoryNode.find(filter).sort({ createdAt: 1 }).lean();
  res.json(nodes);
});

export const getStoryNodeById: RequestHandler = asyncHandler(
  async (req, res) => {
    const { storyId, nodeId } = req.params as {
      storyId: string;
      nodeId: string;
    };
    ensureValidId(storyId, "storyId");
    ensureValidId(nodeId, "nodeId");
    await ensureStoryExists(storyId);

    const node = await StoryNode.findOne({ _id: nodeId, storyId }).lean();

    if (!node) {
      throw new ApiError(404, "Story node not found");
    }

    res.json(node);
  }
);

export const updateStoryNode: RequestHandler = asyncHandler(
  async (req, res) => {
    const { storyId, nodeId } = req.params as {
      storyId: string;
      nodeId: string;
    };
    ensureValidId(storyId, "storyId");
    ensureValidId(nodeId, "nodeId");
    await ensureStoryExists(storyId);

    const update: Partial<StoryNodeDocument> = {};

    if (req.body.type !== undefined) {
      if (!["paragraph", "option"].includes(req.body.type)) {
        throw new ApiError(400, 'type must be either "paragraph" or "option"');
      }
      update.type = req.body.type;
    }

    if (req.body.content?.text !== undefined) {
      if (!req.body.content.text?.trim()) {
        throw new ApiError(400, "content.text cannot be empty");
      }
      update.content = {
        text: req.body.content.text.trim(),
      } as StoryNodeDocument["content"];
    }

    const parentNodesProvided =
      Object.prototype.hasOwnProperty.call(req.body, "parentNodeIds") ||
      Object.prototype.hasOwnProperty.call(req.body, "parentNodeId");
    if (parentNodesProvided) {
      update.parentNodeIds = parseIdArray(
        req.body.parentNodeIds ??
          (req.body.parentNodeId ? [req.body.parentNodeId] : undefined),
        "parentNodeIds"
      );
    }

    const targetNodesProvided =
      Object.prototype.hasOwnProperty.call(req.body, "targetNodeIds") ||
      Object.prototype.hasOwnProperty.call(req.body, "targetNodeId");
    if (targetNodesProvided) {
      update.targetNodeIds = parseIdArray(
        req.body.targetNodeIds ??
          (req.body.targetNodeId ? [req.body.targetNodeId] : undefined),
        "targetNodeIds"
      );
    }

    if (req.body.positionOnFlowchart !== undefined) {
      update.positionOnFlowchart = req.body.positionOnFlowchart;
    }

    if (req.body.chapterTitle !== undefined) {
      update.chapterTitle = req.body.chapterTitle;
    }

    if (req.body.versionId !== undefined) {
      update.versionId = req.body.versionId;
    }

    if (req.body.activeContributors !== undefined) {
      if (!Array.isArray(req.body.activeContributors)) {
        throw new ApiError(
          400,
          "activeContributors must be an array of strings"
        );
      }

      update.activeContributors = req.body.activeContributors.map(
        (contributor: any) => {
          if (typeof contributor !== "string" || !contributor.trim()) {
            throw new ApiError(
              400,
              "activeContributors entries must be non-empty strings"
            );
          }
          return contributor.trim();
        }
      );
    }

    if (req.body.updatedBy !== undefined) {
      if (!req.body.updatedBy?.trim()) {
        throw new ApiError(400, "updatedBy cannot be empty");
      }
      update.updatedBy = req.body.updatedBy.trim();
      console.log(
        `[UPDATE NODE] updatedBy field received: ${update.updatedBy}`
      );
    } else {
      console.log(`[UPDATE NODE] No updatedBy field in request body`);
    }

    const node = await StoryNode.findOneAndUpdate(
      { _id: nodeId, storyId },
      update,
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!node) {
      throw new ApiError(404, "Story node not found");
    }

    const io = req.app.get("io");
    const serializedNode = serializeStoryNode(node);
    io.to(storyId).emit("node-updated", serializedNode);

    // Update user's editedStories array when node is updated
    console.log(
      `[EDITED STORIES] Checking update.updatedBy: ${
        update.updatedBy
      }, type: ${typeof update.updatedBy}`
    );
    if (update.updatedBy) {
      try {
        const story = await Story.findById(storyId);
        if (story) {
          // Convert ObjectId to string for consistency with editedStories schema
          const storyIdStr = (story._id as Types.ObjectId).toString();
          console.log(
            `[EDITED STORIES] Updating editedStories for user ${update.updatedBy} with story ${storyIdStr}`
          );
          await User.findByIdAndUpdate(update.updatedBy, {
            $pull: { editedStories: { storyId: storyIdStr } },
          });
          await User.findByIdAndUpdate(update.updatedBy, {
            $push: {
              editedStories: {
                $each: [
                  {
                    storyId: storyIdStr,
                    lastEditedAt: new Date(),
                  },
                ],
                $position: 0,
                $slice: 20, // Keep only the 20 most recent
              },
            },
          });
          console.log(
            `[EDITED STORIES] Successfully updated editedStories for user ${update.updatedBy}`
          );
        } else {
          console.log(`[EDITED STORIES] Story not found with id ${storyId}`);
        }
      } catch (error) {
        console.error(
          "[EDITED STORIES] Error updating user editedStories:",
          error
        );
        // Don't fail the node update if updating edited stories fails
      }
    } else {
      console.log(
        `[EDITED STORIES] No updatedBy field, skipping editedStories update`
      );
    }

    res.json(node);
  }
);

export const deleteStoryNode: RequestHandler = asyncHandler(
  async (req, res) => {
    const { storyId, nodeId } = req.params as {
      storyId: string;
      nodeId: string;
    };
    ensureValidId(storyId, "storyId");
    ensureValidId(nodeId, "nodeId");
    await ensureStoryExists(storyId);

    // check if there's active contributors on this node
    const nodeToDelete = await StoryNode.findById(nodeId).lean();
    if (nodeToDelete && nodeToDelete.activeContributors.length > 0) {
      throw new ApiError(400, "Cannot delete node with active contributors");
    }

    const node = await StoryNode.findOneAndDelete({
      _id: nodeId,
      storyId,
    }).lean();

    if (!node) {
      throw new ApiError(404, "Story node not found");
    }

    // remove references to this node from other nodes
    await StoryNode.updateMany(
      { parentNodeIds: nodeId },
      { $pull: { parentNodeIds: nodeId } }
    );
    await StoryNode.updateMany(
      { targetNodeIds: nodeId },
      { $pull: { targetNodeIds: nodeId } }
    );

    const io = req.app.get("io");
    io.to(storyId).emit("node-deleted", { nodeId });

    res.status(204).send();
  }
);

export const createConnection: RequestHandler = asyncHandler(
  async (req, res) => {
    const { storyId } = req.params as { storyId: string };
    const { sourceNodeId, targetNodeId, updatedBy } = req.body as {
      sourceNodeId: string;
      targetNodeId: string;
      updatedBy: string;
    };

    ensureValidId(storyId, "storyId");
    ensureValidId(sourceNodeId, "sourceNodeId");
    ensureValidId(targetNodeId, "targetNodeId");
    await ensureStoryExists(storyId);

    if (!updatedBy?.trim()) {
      throw new ApiError(400, "updatedBy is required");
    }

    const sourceNode = await StoryNode.findOneAndUpdate(
      { _id: sourceNodeId, storyId },
      {
        $addToSet: { targetNodeIds: targetNodeId },
        updatedBy: updatedBy.trim(),
      },
      { new: true }
    );

    const targetNode = await StoryNode.findOneAndUpdate(
      { _id: targetNodeId, storyId },
      {
        $addToSet: { parentNodeIds: sourceNodeId },
        updatedBy: updatedBy.trim(),
      },
      { new: true }
    );

    if (!sourceNode || !targetNode) {
      throw new ApiError(404, "One or both nodes not found");
    }

    const io = req.app.get("io");
    const serializedSource = serializeStoryNode(sourceNode);
    const serializedTarget = serializeStoryNode(targetNode);
    io.to(storyId).emit("connection-created", {
      sourceNode: serializedSource,
      targetNode: serializedTarget,
    });

    res.status(200).json({ source: sourceNode, target: targetNode });
  }
);

export const deleteConnection: RequestHandler = asyncHandler(
  async (req, res) => {
    const { storyId } = req.params as { storyId: string };
    const { sourceNodeId, targetNodeId, updatedBy } = req.body as {
      sourceNodeId: string;
      targetNodeId: string;
      updatedBy: string;
    };

    ensureValidId(storyId, "storyId");
    ensureValidId(sourceNodeId, "sourceNodeId");
    ensureValidId(targetNodeId, "targetNodeId");
    await ensureStoryExists(storyId);

    if (!updatedBy?.trim()) {
      throw new ApiError(400, "updatedBy is required");
    }

    const sourceNode = await StoryNode.findOneAndUpdate(
      { _id: sourceNodeId, storyId },
      { $pull: { targetNodeIds: targetNodeId }, updatedBy: updatedBy.trim() },
      { new: true }
    );

    const targetNode = await StoryNode.findOneAndUpdate(
      { _id: targetNodeId, storyId },
      { $pull: { parentNodeIds: sourceNodeId }, updatedBy: updatedBy.trim() },
      { new: true }
    );

    if (!sourceNode || !targetNode) {
      throw new ApiError(404, "One or both nodes not found");
    }

    const io = req.app.get("io");
    io.to(storyId).emit("connection-deleted", { sourceNodeId, targetNodeId });

    res.status(200).json({ source: sourceNode, target: targetNode });
  }
);

export const updateFlowchartNodePosition: RequestHandler = asyncHandler(
  async (req, res) => {
    const { storyId, nodeId } = req.params as {
      storyId: string;
      nodeId: string;
    };
    const { positionOnFlowchart, updatedBy } = req.body as {
      positionOnFlowchart: { x: number; y: number };
      updatedBy: string;
    };

    ensureValidId(storyId, "storyId");
    ensureValidId(nodeId, "nodeId");
    await ensureStoryExists(storyId);

    if (!positionOnFlowchart) {
      throw new ApiError(400, "positionOnFlowchart is required");
    }

    if (!updatedBy?.trim()) {
      throw new ApiError(400, "updatedBy is required");
    }

    const node = await StoryNode.findOneAndUpdate(
      { _id: nodeId, storyId },
      { positionOnFlowchart, updatedBy: updatedBy.trim() },
      { new: true, runValidators: true }
    ).lean();

    if (!node) {
      throw new ApiError(404, "Story node not found");
    }

    const io = req.app.get("io");
    const serializedNode = serializeStoryNode(node);
    io.to(storyId).emit("node-position-updated", serializedNode);

    res.json(node);
  }
);

export const addActiveContributor: RequestHandler = asyncHandler(
  async (req, res) => {
    const { storyId, nodeId } = req.params as {
      storyId: string;
      nodeId: string;
    };
    const { userId } = req.body as { userId: string };

    ensureValidId(storyId, "storyId");
    ensureValidId(nodeId, "nodeId");
    ensureValidId(userId, "userId");
    await ensureStoryExists(storyId);

    const updatedNode = await StoryNode.findOneAndUpdate(
      { _id: nodeId },
      { $addToSet: { activeContributors: userId } },
      { new: true }
    ).lean();

    if (!updatedNode) {
      throw new ApiError(404, "Story node not found");
    }

    const io = req.app.get("io");
    const serializedNode = serializeStoryNode(updatedNode);
    io.to(storyId).emit("user-joined-node", {
      nodeId: updatedNode._id.toString(),
      userId,
      activeContributors: serializedNode.activeContributors,
    });

    // Update user's editedStories when they join as active contributor
    try {
      const story = await Story.findById(storyId);
      if (story) {
        // Convert ObjectId to string for consistency with editedStories schema
        const storyIdStr = (story._id as Types.ObjectId).toString();
        console.log(
          `Adding user ${userId} to editedStories for story ${storyIdStr}`
        );
        await User.findByIdAndUpdate(userId, {
          $pull: { editedStories: { storyId: storyIdStr } },
        });
        await User.findByIdAndUpdate(userId, {
          $push: {
            editedStories: {
              $each: [
                {
                  storyId: storyIdStr,
                  lastEditedAt: new Date(),
                },
              ],
              $position: 0,
              $slice: 20, // Keep only the 20 most recent
            },
          },
        });
        console.log(`Successfully added user ${userId} to editedStories`);
      }
    } catch (error) {
      console.error("Error updating user editedStories:", error);
      // Don't fail the contributor addition if updating edited stories fails
    }

    res.json(updatedNode);
  }
);

export const removeActiveContributor: RequestHandler = asyncHandler(
  async (req, res) => {
    const { storyId, nodeId } = req.params as {
      storyId: string;
      nodeId: string;
    };
    const { userId } = req.body as { userId: string };

    ensureValidId(storyId, "storyId");
    ensureValidId(nodeId, "nodeId");
    ensureValidId(userId, "userId");
    await ensureStoryExists(storyId);

    const updatedNode = await StoryNode.findOneAndUpdate(
      { _id: nodeId },
      { $pull: { activeContributors: userId } },
      { new: true }
    ).lean();

    if (!updatedNode) {
      throw new ApiError(404, "Story node not found");
    }

    const io = req.app.get("io");
    const serializedNode = serializeStoryNode(updatedNode);
    io.to(storyId).emit("user-left-node", {
      nodeId: updatedNode._id.toString(),
      userId,
      activeContributors: serializedNode.activeContributors,
    });

    res.json(updatedNode);
  }
);

interface StoryNodePlain {
  _id: Types.ObjectId;
  storyId: Types.ObjectId;
  versionId?: string | null;
  type: StoryNodeType;
  parentNodeIds: Types.ObjectId[];
  targetNodeIds: Types.ObjectId[];
  positionOnFlowchart: { x: number; y: number };
  chapterTitle?: string | null;
  content: { text: string };
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export const getStoryNodeTree: RequestHandler = asyncHandler(
  async (req, res) => {
    const { versionId } = req.query as { versionId?: string };

    if (!versionId) {
      throw new ApiError(400, "versionId is required");
    }

    ensureValidId(versionId, "versionId");

    // Fetch the version to get storyId and rootNodeId
    const version = await StoryVersion.findById(versionId).lean();
    if (!version) {
      throw new ApiError(404, "Story version not found");
    }

    console.log("Fetching tree for version:", versionId);
    console.log("Version data:", {
      _id: version._id,
      storyId: version.storyId,
      rootNodeId: version.rootNodeId,
    });

    // Fetch all nodes for this version
    // Note: versionId in StoryNode documents is stored as a string
    const nodes = await StoryNode.find({
      storyId: version.storyId,
      versionId: String(version._id),
    })
      .sort({ createdAt: 1 })
      .lean<StoryNodePlain[]>();

    console.log("Found nodes:", nodes.length);

    // Build the tree structure
    const map = new Map<
      string,
      StoryNodePlain & { children: StoryNodePlain[] }
    >();

    nodes.forEach((node) => {
      const enhanced = { ...node, children: [] as StoryNodePlain[] };
      map.set(String(node._id), enhanced);
    });

    // Connect parent-child relationships
    map.forEach((node) => {
      const parentIds = (node.parentNodeIds ?? []).map((parentId) =>
        String(parentId)
      );

      parentIds.forEach((parentId) => {
        const parent = map.get(parentId);
        if (parent) {
          parent.children.push(node);
        }
      });
    });

    // Return the root node with its entire tree
    const rootNode = version.rootNodeId ? map.get(version.rootNodeId) : null;

    console.log("Looking for rootNodeId:", version.rootNodeId);
    console.log("Map keys:", Array.from(map.keys()).slice(0, 5)); // Show first 5 keys
    console.log("Root node found:", !!rootNode);

    if (!rootNode) {
      // If no root node, return all nodes without parents (orphaned roots)
      const roots: (StoryNodePlain & { children: StoryNodePlain[] })[] = [];
      map.forEach((node) => {
        if (node.parentNodeIds.length === 0) {
          roots.push(node);
        }
      });
      console.log(
        "No root node found, returning orphaned roots:",
        roots.length
      );
      res.json(roots);
      return;
    }

    console.log(
      "Returning root node with children:",
      rootNode.children?.length || 0
    );
    try {
      res.json([rootNode]); // Return array with single root for consistency
    } catch (e: any) {
      const errorMessage: string = e.message ?? "Unknown error";
      console.error("Failed to stringify:", e);
      res.status(500).json({ error: errorMessage });
    }
  }
);
