import express from 'express';
import { createMeeting, listMeetings, deleteMeeting } from '../controllers/meetingController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(listMeetings)
  .post(restrictTo('Super Admin', 'Admin', 'Project Manager'), createMeeting);

router.route('/:id')
  .delete(deleteMeeting);

export default router;
