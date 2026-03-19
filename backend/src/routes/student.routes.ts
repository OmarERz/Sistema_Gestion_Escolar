import { Router } from 'express';
import * as studentController from '../controllers/student.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createStudentSchema, updateStudentSchema } from '../schemas/student.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', studentController.list);
router.post('/', validateRequest({ body: createStudentSchema }), studentController.create);
router.get('/:id', studentController.getById);
router.put('/:id', validateRequest({ body: updateStudentSchema }), studentController.update);
router.get('/:id/payments', studentController.getPayments);
router.get('/:id/uniforms', studentController.getUniforms);
router.get('/:id/debt', studentController.getDebt);
router.get('/:id/academic-history', studentController.getAcademicHistory);

export default router;
