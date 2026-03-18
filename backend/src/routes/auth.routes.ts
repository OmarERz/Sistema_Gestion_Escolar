import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { loginSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/login', validateRequest({ body: loginSchema }), authController.login);
router.get('/me', authenticate, authController.me);

export default router;
