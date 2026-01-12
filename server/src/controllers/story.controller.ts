import type { RequestHandler } from "express";
import { isValidObjectId, Types } from "mongoose";
import type { FilterQuery } from "mongoose";
import {
  Story,
  type StoryDocument,
  type StoryTag,
  type StoryAttributes,
} from "../models/story.model.js";
import { StoryNode } from "../models/storyNode.model.js";
import {
  StoryVersion,
  type StoryVersionDocument,
} from "../models/storyVersion.model.js";
import { ApiError } from "../utils/apiError.js";
import type { Server } from "socket.io";
import { asyncHandler } from "../utils/asyncHandler.js";
import { bucket } from "../config/firebaseAdmin.js";
import { v4 as uuidv4 } from "uuid";
import { User } from "../models/user.model.js";

const ensureValidId = (id: string, label: string) => {
  if (!isValidObjectId(id)) {
    throw new ApiError(400, `${label} is not a valid identifier`);
  }
};

export const createStory: RequestHandler = asyncHandler(async (req, res) => {
  const { title, ownerId, description, tags, contributors, image } =
    req.body as StoryAttributes;

  if (!title?.trim()) {
    throw new ApiError(400, "title is required");
  }

  if (!ownerId?.trim()) {
    throw new ApiError(400, "ownerId is required");
  }

  const story = await Story.create({
    ownerId: ownerId.trim(),
    title: title.trim(),
    description: description ?? "",
    tags: (tags ?? []) as StoryTag[],
    contributors: contributors ?? [{ userId: ownerId, joinedAt: new Date() }],
    image: image ?? null,
  });

  // Create the root node now that we have a valid storyId
  const rootNode = await StoryNode.create({
    storyId: story._id,
    type: "paragraph",
    parentNodeIds: [],
    targetNodeIds: [],
    positionOnFlowchart: { x: 0, y: 0 },
    chapterTitle: "Story Root Node",
    content: { text: "This is the beginning of your story." },
    createdBy: ownerId,
    updatedBy: ownerId,
  });

  // Create the initial version with the root node
  const storyVersion: StoryVersionDocument = await StoryVersion.create({
    storyId: story._id,
    versionNumber: 1,
    nodeIds: [rootNode._id],
    rootNodeId: String(rootNode._id),
    createdBy: ownerId,
    updatedBy: ownerId,
  });

  // Set versionId on the root node (it's a string, not an array)
  await StoryNode.findByIdAndUpdate(rootNode._id, {
    versionId: String(storyVersion._id),
  });

  // Add the story to the owner's editedStories array
  try {
    const storyIdStr = (story._id as Types.ObjectId).toString();
    await User.findByIdAndUpdate(ownerId, {
      $pull: { editedStories: { storyId: storyIdStr } },
    });
    await User.findByIdAndUpdate(ownerId, {
      $push: {
        editedStories: {
          $each: [
            {
              storyId: storyIdStr,
              lastEditedAt: new Date(),
            },
          ],
          $position: 0,
          $slice: 20,
        },
      },
    });
    console.log(
      `[CREATE STORY] Added story ${storyIdStr} to user ${ownerId}'s editedStories`
    );
  } catch (error) {
    console.error("[CREATE STORY] Error adding story to editedStories:", error);
    // Don't fail the story creation if this fails
  }

  res.status(201).json(story);
});

export const listStories: RequestHandler = asyncHandler(async (req, res) => {
  const { ownerId, tag, search } = req.query as {
    ownerId?: string;
    tag?: string;
    search?: string;
  };

  const filter: FilterQuery<StoryDocument> = {};

  if (ownerId) {
    ensureValidId(ownerId, "ownerId");
    const user = await User.findById(ownerId).select("editedStories").lean();
    if (user && user.editedStories && user.editedStories.length > 0) {
      filter._id = {
        $in: user.editedStories.map((editedInfo) => editedInfo.storyId),
      };
    } else {
      // No stories to return - return empty array
      filter._id = { $in: [] };
    }
  }

  if (tag) {
    filter.tags = tag;
  }

  if (search) {
    const pattern = new RegExp(search, "i");
    filter.$or = [{ title: pattern }, { description: pattern }];
  }

  const stories = await Story.find(filter).sort({ updatedAt: -1 }).lean();
  res.json(stories);
});

export const getStoryById: RequestHandler = asyncHandler(async (req, res) => {
  const { storyId } = req.params as { storyId: string };
  ensureValidId(storyId, "storyId");

  const story = await Story.findById(storyId).lean();

  if (!story) {
    throw new ApiError(404, "Story not found");
  }

  res.json(story);
});

export const getStoryDetail: RequestHandler = asyncHandler(async (req, res) => {
  const { storyId } = req.params as { storyId: string };
  ensureValidId(storyId, "storyId");

  const story = await Story.findById(storyId).lean();

  if (!story) {
    throw new ApiError(404, "Story not found");
  }

  // Get the published version if it exists
  let currentVersion = null;
  if (story.publishedVersionId) {
    currentVersion = await StoryVersion.findById(
      story.publishedVersionId
    ).lean();
  }

  // Return story detail with additional fields
  // Note: isStarred and isOwner would require userId from auth, for now returning defaults
  const storyDetail = {
    ...story,
    currentVersion,
    isStarred: false, // TODO: Get from auth context
    isOwner: false, // TODO: Get from auth context
  };

  res.json(storyDetail);
});

export const getStoryReadCount: RequestHandler = asyncHandler(
  async (req, res) => {
    const { storyId } = req.params as { storyId: string };
    ensureValidId(storyId, "storyId");

    const story = await Story.findById(storyId).lean();
    const publishedVersionId = story?.publishedVersionId;
    if (!publishedVersionId) {
      return res.json({ readCount: 0 });
    }
    const storyVersion = await StoryVersion.findById(publishedVersionId).lean();
    const readCount = storyVersion?.readCount || 0;

    res.json({ readCount });
  }
);

export const updateStory: RequestHandler = asyncHandler(async (req, res) => {
  const { storyId } = req.params as { storyId: string };
  ensureValidId(storyId, "storyId");

  const update: Partial<StoryDocument> = {};

  // If trying to publish (setting publishedVersionId), verify ownership first
  if (req.body.publishedVersionId !== undefined) {
    const { userId } = req.body as { userId?: string };
    if (!userId) {
      throw new ApiError(400, "userId is required when publishing a story");
    }

    const story = await Story.findById(storyId).lean();
    if (!story) {
      throw new ApiError(404, "Story not found");
    }

    // Check if the user is the owner
    if (story.ownerId.toString() !== userId) {
      throw new ApiError(403, "Only the story owner can publish this story");
    }

    update.publishedVersionId = req.body.publishedVersionId;
    emitVersionPublished(
      req.app.get("io"),
      storyId,
      req.body.publishedVersionId
    );
  }

  if (req.body.title !== undefined) {
    if (!req.body.title?.trim()) {
      throw new ApiError(400, "title cannot be empty");
    }
    update.title = req.body.title.trim();
  }

  if (req.body.description !== undefined) {
    update.description = req.body.description;
  }

  if (req.body.tags !== undefined) {
    update.tags = req.body.tags;
  }

  if (req.body.contributors !== undefined) {
    update.contributors = req.body.contributors;
  }

  if (req.body.image !== undefined) {
    // Changed from coverImageUrl to image
    update.image = req.body.image;
  }

  if (req.body.activeContributors !== undefined) {
    update.activeContributors = req.body.activeContributors;
  }

  if (req.body.lastPublishedAt !== undefined) {
    update.lastPublishedAt = req.body.lastPublishedAt;
  }

  const story = await Story.findByIdAndUpdate(storyId, update, {
    new: true,
    runValidators: true,
  }).lean();

  if (!story) {
    throw new ApiError(404, "Story not found");
  }

  res.json(story);
});

export const emitVersionPublished = (
  io: Server,
  storyId: string,
  versionId: string
) => {
  io.to(storyId).emit("new-version-published", versionId);
  console.log(`Emitted node-created to room ${storyId}:`, versionId);
};

export const deleteStory: RequestHandler = asyncHandler(async (req, res) => {
  const { storyId } = req.params as { storyId: string };
  const { userId } = req.body as { userId?: string };

  ensureValidId(storyId, "storyId");

  if (!userId) {
    throw new ApiError(400, "userId is required");
  }

  const story = await Story.findById(storyId).lean();

  if (!story) {
    throw new ApiError(404, "Story not found");
  }

  // Check if the user is the owner
  if (story.ownerId.toString() !== userId) {
    throw new ApiError(403, "Only the story owner can delete this story");
  }

  await Story.findByIdAndDelete(storyId);
  await StoryNode.deleteMany({ storyId });
  await StoryVersion.deleteMany({ storyId });

  res.status(204).send();
});

export const uploadStoryCover: RequestHandler = asyncHandler(
  async (req, res) => {
    const { storyId } = req.params;
    const file = req.file;

    if (!file) {
      throw new ApiError(400, "No file uploaded.");
    }

    if (!storyId) {
      throw new ApiError(400, "Story ID is required.");
    }
    ensureValidId(storyId, "storyId");

    const story = await Story.findById(storyId);
    if (!story) {
      throw new ApiError(404, "Story not found");
    }

    const blob = bucket.file(
      `story-covers/${storyId}/${uuidv4()}-${file.originalname}`
    );

    try {
      await blob.save(file.buffer, {
        metadata: { contentType: file.mimetype },
      });
      await blob.makePublic(); // Make the file publicly accessible
    } catch (error) {
      console.error("Story cover upload failed:", error);
      throw new ApiError(
        500,
        `Error uploading file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    const publicUrl = blob.publicUrl(); // Get the public URL

    // Update story's image field
    story.image = publicUrl;
    await story.save();

    res.status(200).json({
      message: "File uploaded successfully.",
      imageUrl: publicUrl,
    });
  }
);
