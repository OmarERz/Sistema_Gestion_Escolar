import { Router } from 'express';
import * as paymentConceptController from '../controllers/paymentConcept.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createPaymentConceptSchema, updatePaymentConceptSchema } from '../schemas/paymentConcept.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', paymentConceptController.list);
router.post('/', validateRequest({ body: createPaymentConceptSchema }), paymentConceptController.create);
router.put('/:id', validateRequest({ body: updatePaymentConceptSchema }), paymentConceptController.update);

export default router;
