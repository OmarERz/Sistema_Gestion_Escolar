import { Router } from 'express';
import * as schoolCycleController from '../controllers/schoolCycle.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createSchoolCycleSchema, updateSchoolCycleSchema } from '../schemas/schoolCycle.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', schoolCycleController.list);
router.post('/', validateRequest({ body: createSchoolCycleSchema }), schoolCycleController.create);
router.put('/:id', validateRequest({ body: updateSchoolCycleSchema }), schoolCycleController.update);
router.patch('/:id/activate', schoolCycleController.activate);

export default router;
