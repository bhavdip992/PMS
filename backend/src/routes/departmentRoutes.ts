import express from 'express';
import { 
  createDepartment, 
  getDepartment, 
  updateDepartment, 
  deleteDepartment, 
  listDepartments 
} from '../controllers/departmentController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(listDepartments)
  .post(restrictTo('Super Admin', 'Admin'), createDepartment);

router.route('/:id')
  .get(getDepartment)
  .patch(restrictTo('Super Admin', 'Admin'), updateDepartment)
  .delete(restrictTo('Super Admin', 'Admin'), deleteDepartment);

export default router;
