import express from 'express';
import { 
  logCommunication, 
  getCommunication, 
  listCommunications, 
  deleteCommunication 
} from '../controllers/communicationController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(listCommunications)
  .post(logCommunication);

router.route('/:id')
  .get(getCommunication)
  .delete(restrictTo('Super Admin', 'Admin', 'Project Manager'), deleteCommunication);

export default router;
