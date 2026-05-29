import express from 'express';
import { 
  createTag,
  deleteTag,
  listTags
} from '../controllers/tagController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(listTags)
  .post(restrictTo('Super Admin'), createTag);

router.route('/:id')
  .delete(restrictTo('Super Admin'), deleteTag);

export default router;
