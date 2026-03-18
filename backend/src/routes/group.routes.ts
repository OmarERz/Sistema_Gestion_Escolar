import { Router } from 'express';
import * as groupController from '../controllers/group.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createGroupSchema, updateGroupSchema } from '../schemas/group.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', groupController.list);
router.post('/', validateRequest({ body: createGroupSchema }), groupController.create);
router.put('/:id', validateRequest({ body: updateGroupSchema }), groupController.update);
router.patch('/:id/empty', groupController.empty);
router.delete('/:id', groupController.remove);

export default router;
