import express from 'express';
import { 
  summarizeCommunication, 
  generateTasks, 
  getDailyStandup,
  summarizeTask,
  getProductivityInsights,
  getSearchAssistant,
  getNotificationAlerts,
  getDevAssistant
} from '../controllers/aiController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/summarize', summarizeCommunication);
router.post('/generate-tasks', generateTasks);
router.get('/standup', getDailyStandup);

// New Gemini Integration Endpoints
router.post('/task-summary', summarizeTask);
router.post('/productivity-insights', getProductivityInsights);
router.post('/search-assistant', getSearchAssistant);
router.get('/notification-alerts', getNotificationAlerts);
router.post('/dev-assistant', getDevAssistant);

export default router;
