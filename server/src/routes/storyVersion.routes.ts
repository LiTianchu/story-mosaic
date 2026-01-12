import { Router } from 'express';
import * as storyVersionController from '../controllers/storyVersion.controller.js';

const router = Router();

router.post('/', storyVersionController.createStoryVersion);
router.get('/story/:storyId/draft', storyVersionController.getDraftVersionByStoryId);
router.get('/story/:storyId', storyVersionController.listStoryVersions);
router.get('/:id', storyVersionController.getStoryVersionById);
router.put('/:id', storyVersionController.updateStoryVersion);
router.patch('/:id/add-node', storyVersionController.addNodeIdToStoryVersion);
router.patch('/:id/delete-node', storyVersionController.deleteNodeIdFromStoryVersion);
router.patch('/:id/increment-read-count', storyVersionController.incrementStoryVersionReadCount);
router.post('/:id/clone', storyVersionController.cloneStoryVersion);

export default router;
