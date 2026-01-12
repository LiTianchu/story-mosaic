import { Router } from 'express';
import * as starController from '../controllers/star.controller.js';

const router = Router({ mergeParams: true });

router.post('/toggle-star', starController.toggleStar);
router.get('/user/:userId', starController.getStarByStoryAndUserId);

export {router as storyStarRouter};
