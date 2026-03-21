import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createPaymentSchema,
  updatePaymentSchema,
  createTransactionSchema,
  bulkGenerateSchema,
} from '../schemas/payment.schema.js';

const router = Router();

router.use(authenticate);

// Bulk operations (before /:id to avoid route conflicts)
router.post('/bulk-generate', validateRequest({ body: bulkGenerateSchema }), paymentController.bulkGenerate);
router.post('/check-overdue', paymentController.checkOverdue);
router.delete('/transactions/:id', paymentController.removeTransaction);
router.delete('/student/:id/reset', paymentController.resetStudentPayments);

// Payment CRUD
router.get('/', paymentController.list);
router.post('/', validateRequest({ body: createPaymentSchema }), paymentController.create);
router.get('/:id', paymentController.getById);
router.put('/:id', validateRequest({ body: updatePaymentSchema }), paymentController.update);
router.delete('/:id', paymentController.remove);
router.patch('/:id/cancel', paymentController.cancel);

// Transactions on a specific payment
router.post('/:id/transactions', validateRequest({ body: createTransactionSchema }), paymentController.addTransaction);

export default router;
