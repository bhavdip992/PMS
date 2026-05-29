import express from 'express';
import { 
  createSubtask, 
  getSubtask, 
  updateSubtask, 
  deleteSubtask, 
  listSubtasks,
  toggleSubtask,
  getSubtaskComments,
  createSubtaskComment,
  listAllSubtasks
} from '../controllers/subtaskController.js';
import { getSubtaskActivities } from '../controllers/activityLogController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(listAllSubtasks)
  .post(createSubtask);

router.route('/task/:taskId')
  .get(listSubtasks)
  .post(createSubtask);

router.route('/:id')
  .get(getSubtask)
  .put(updateSubtask)
  .patch(updateSubtask)
  .delete(deleteSubtask);

router.route('/:id/toggle')
  .put(toggleSubtask);

router.route('/:id/comments')
  .get(getSubtaskComments)
  .post(createSubtaskComment);

router.route('/:id/activities')
  .get(getSubtaskActivities);

export default router;
