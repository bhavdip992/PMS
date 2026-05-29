import express from 'express';
import { 
  createTask, 
  getTask, 
  updateTask, 
  deleteTask, 
  listTasks,
  addChecklistItem,
  toggleChecklistItem,
  removeChecklistItem,
  getTaskDependencies,
  addTaskDependency
} from '../controllers/taskController.js';
import { 
  createComment, 
  getCommentsForTask, 
  deleteComment 
} from '../controllers/commentController.js';
import { getTaskActivities } from '../controllers/activityLogController.js';
import { getTaskTimeLogs } from '../controllers/timeLogController.js';
import { createSubtask, listSubtasks } from '../controllers/subtaskController.js';
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

router.route('/:id/activity')
  .get(getTaskActivities);

// Task subtasks integration
router.route('/:taskId/subtasks')
  .get(listSubtasks)
  .post(createSubtask);

// Task dependencies integration
router.route('/:id/dependencies')
  .get(getTaskDependencies)
  .post(addTaskDependency);

// Task time logs integration
router.route('/:id/time-logs')
  .get(getTaskTimeLogs);

export default router;
