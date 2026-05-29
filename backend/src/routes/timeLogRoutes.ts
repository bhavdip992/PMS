import express from 'express';
import { 
  startTimer, 
  stopTimer, 
  getActiveTimer, 
  logTimeManual, 
  listTimeLogs,
  deleteTimeLog
} from '../controllers/timeLogController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(listTimeLogs)
  .post(logTimeManual);

router.route('/start')
  .post(startTimer);

router.route('/stop')
  .post(stopTimer);

router.route('/active')
  .get(getActiveTimer);

router.route('/:id')
  .delete(deleteTimeLog);

export default router;
