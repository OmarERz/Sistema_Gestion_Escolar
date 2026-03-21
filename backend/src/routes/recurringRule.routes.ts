import { Router } from 'express';
import * as recurringRuleController from '../controllers/recurringRule.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createRecurringRuleSchema, updateRecurringRuleSchema } from '../schemas/recurringRule.schema.js';

const router = Router();

router.use(authenticate);

// Generate must be before /:id to avoid route conflict
router.post('/generate', recurringRuleController.generate);

router.get('/', recurringRuleController.list);
router.post('/', validateRequest({ body: createRecurringRuleSchema }), recurringRuleController.create);
router.put('/:id', validateRequest({ body: updateRecurringRuleSchema }), recurringRuleController.update);
router.delete('/:id', recurringRuleController.remove);

export default router;
