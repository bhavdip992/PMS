import express from 'express';
import { 
  createSubtask, 
  getSubtask, 
  updateSubtask, 
  deleteSubtask, 
  listSubtasks,
  toggleSubtask,
  getSubtaskComments,
  createSubtaskComment
} from '../controllers/subtaskController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createSubtask);

router.route('/task/:taskId')
  .get(listSubtasks)
  .post(createSubtask);

router.route('/:id')
  .get(getSubtask)
  .put(updateSubtask)
  .delete(deleteSubtask);

router.route('/:id/toggle')
  .put(toggleSubtask);

router.route('/:id/comments')
  .get(getSubtaskComments)
  .post(createSubtaskComment);

export default router;
