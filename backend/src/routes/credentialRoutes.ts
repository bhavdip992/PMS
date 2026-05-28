import express from 'express';
import { 
  createCredential, 
  getCredentialsForProject, 
  deleteCredential 
} from '../controllers/credentialController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/project/:projectId')
  .post(createCredential)
  .get(getCredentialsForProject);

router.route('/:id')
  .delete(deleteCredential);

export default router;
