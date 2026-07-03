import { Router } from 'express';
import mcpController from '../controllers/mcpController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/ask', mcpController.queryDatabase);
router.post('/query', verifyToken, mcpController.queryDatabase);
router.post('/recommend', verifyToken, mcpController.getRecommendation);
router.post('/recommendation', verifyToken, mcpController.getRecommendation);

export default router;
