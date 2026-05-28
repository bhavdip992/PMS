import express from 'express';
import { 
  createTask, 
  getTask, 
  updateTask, 
  deleteTask, 
  listTasks,
  addChecklistItem,
  toggleChecklistItem,
  removeChecklistItem
} from '../controllers/taskController.js';
import { 
  createComment, 
  getCommentsForTask, 
  deleteComment 
} from '../controllers/commentController.js';
import { getTaskActivities } from '../controllers/activityLogController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(listTasks)
  .post(createTask);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

router.route('/:id/checklist')
  .post(addChecklistItem);

router.route('/:id/checklist/:itemId')
  .put(toggleChecklistItem)
  .delete(removeChecklistItem);

// Task comments integration
router.route('/:taskId/comments')
  .get(getCommentsForTask)
  .post(createComment);

router.route('/comments/:commentId')
  .delete(deleteComment);

// Task activities integration
router.route('/:id/activities')
  .get(getTaskActivities);

export default router;
