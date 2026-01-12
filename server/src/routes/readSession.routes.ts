import { Router } from 'express';
import * as readSessionController from '../controllers/readSession.controller.js';

const router = Router();

router.get('/', readSessionController.getReadSession);
router.post('/', readSessionController.createReadSession);
router.put('/', readSessionController.updateReadSession);
router.delete('/', readSessionController.deleteReadSession);

export default router;
