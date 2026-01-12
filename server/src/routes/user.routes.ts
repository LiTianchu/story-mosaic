import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import upload from '../middleware/upload.js';

const router = Router();

router.post('/', userController.addUser);
router.put('/:id/avatar', upload.single('avatar'), userController.uploadAvatar);
router.get('/uid/:uid', userController.getUserByUid); // More specific route first
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);

export default router;
