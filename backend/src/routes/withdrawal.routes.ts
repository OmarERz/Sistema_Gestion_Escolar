import { Router } from 'express';
import * as withdrawalController from '../controllers/withdrawal.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createWithdrawalSchema, reenrollSchema } from '../schemas/withdrawal.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', withdrawalController.list);
router.post('/', validateRequest({ body: createWithdrawalSchema }), withdrawalController.process);
router.post('/:id/undo', withdrawalController.undo);
router.post('/:id/reenroll', validateRequest({ body: reenrollSchema }), withdrawalController.reenroll);

export default router;
