import { Router } from "express";
import {
  createStoryNode,
  deleteStoryNode,
  getStoryNodeById,
  getStoryNodeTree,
  listStoryNodes,
  updateStoryNode,
  createConnection,
  deleteConnection,
  updateFlowchartNodePosition,
  addActiveContributor,
  removeActiveContributor,
} from "../controllers/storyNode.controller.js";

const router = Router({ mergeParams: true });

router.post("/", createStoryNode);
router.post("/connection", createConnection);
router.delete("/connection", deleteConnection);
router.patch("/:nodeId/position", updateFlowchartNodePosition);
router.get("/", listStoryNodes);
router.get("/tree", getStoryNodeTree);
router.get("/:nodeId", getStoryNodeById);
router.put("/:nodeId", updateStoryNode);
router.delete("/:nodeId", deleteStoryNode);
router.post("/:nodeId/add-contributor", addActiveContributor);
router.post("/:nodeId/remove-contributor", removeActiveContributor);

export { router as storyNodeRouter };
