import { Router } from 'express';
import * as paymentMethodController from '../controllers/paymentMethod.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createPaymentMethodSchema, updatePaymentMethodSchema } from '../schemas/paymentMethod.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', paymentMethodController.list);
router.post('/', validateRequest({ body: createPaymentMethodSchema }), paymentMethodController.create);
router.put('/:id', validateRequest({ body: updatePaymentMethodSchema }), paymentMethodController.update);

export default router;
