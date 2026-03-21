import { Router } from 'express';
import * as guardianController from '../controllers/guardian.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createGuardianSchema, updateGuardianSchema, fiscalDataSchema, updateStudentLinkSchema } from '../schemas/guardian.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', guardianController.list);
router.post('/', validateRequest({ body: createGuardianSchema }), guardianController.create);
router.get('/check-duplicate', guardianController.checkDuplicate);
router.get('/:id', guardianController.getById);
router.put('/:id', validateRequest({ body: updateGuardianSchema }), guardianController.update);
router.post('/:id/fiscal-data', validateRequest({ body: fiscalDataSchema }), guardianController.upsertFiscalData);
router.delete('/:id/students/:studentId', guardianController.unlinkStudent);
router.patch('/:id/students/:studentId', validateRequest({ body: updateStudentLinkSchema }), guardianController.updateStudentLink);

export default router;
