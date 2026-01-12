import { Router } from "express";
import {
  createStory,
  deleteStory,
  getStoryById,
  listStories,
  updateStory,
  getStoryReadCount,
  getStoryDetail,
  uploadStoryCover,
} from "../controllers/story.controller.js";
import { storyNodeRouter } from "./storyNode.routes.js";
import { storyStarRouter } from "./star.routes.js";
import upload from "../middleware/upload.js";

const router = Router();

router.post("/", createStory);
router.put("/:storyId/cover", upload.single("cover"), uploadStoryCover);
router.get("/", listStories);
router.get("/:storyId/detail", getStoryDetail);
router.get("/:storyId/read-count", getStoryReadCount);
router.get("/:storyId", getStoryById);
router.put("/:storyId", updateStory);
router.delete("/:storyId", deleteStory);
router.use("/:storyId/star", storyStarRouter);
router.use("/:storyId/nodes", storyNodeRouter);

export { router as storyRouter };
