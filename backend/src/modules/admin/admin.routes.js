import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import * as controller from './admin.controller.js';

const router = Router();

router.get('/dashboard', authenticate, controller.dashboard);

export default router;
