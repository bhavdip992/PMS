import express from 'express';
import { 
  createTeam, 
  getTeam, 
  updateTeam, 
  deleteTeam, 
  addMember, 
  removeMember, 
  listTeams 
} from '../controllers/teamController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(listTeams)
  .post(restrictTo('Super Admin', 'Admin', 'Project Manager'), createTeam);

router.route('/:id')
  .get(getTeam)
  .put(restrictTo('Super Admin', 'Admin', 'Project Manager'), updateTeam)
  .delete(restrictTo('Super Admin', 'Admin'), deleteTeam);

router.route('/:id/members')
  .post(restrictTo('Super Admin', 'Admin', 'Project Manager'), addMember)
  .delete(restrictTo('Super Admin', 'Admin', 'Project Manager'), removeMember);

export default router;
