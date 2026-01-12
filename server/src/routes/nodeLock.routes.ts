import { Router } from "express";
import * as nodeLockController from "../controllers/nodeLock.controller.js";

// Not really used in the current implementation of locking but set up for future use
const router = Router();

router.get("/", nodeLockController.getNodeLock);
router.post("/", nodeLockController.createNodeLock);
router.put("/", nodeLockController.updateNodeLock);
router.delete("/", nodeLockController.deleteNodeLock);

export default router;
