import { Router } from 'express';
import * as uniformController from '../controllers/uniform.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createCatalogSchema,
  updateCatalogSchema,
  createOrderSchema,
  updateUniformSchema,
} from '../schemas/uniform.schema.js';

const router = Router();

router.use(authenticate);

// Catalog CRUD
router.get('/catalog', uniformController.listCatalog);
router.post('/catalog', validateRequest({ body: createCatalogSchema }), uniformController.createCatalog);
router.put('/catalog/:id', validateRequest({ body: updateCatalogSchema }), uniformController.updateCatalog);
router.delete('/catalog/:id', uniformController.deleteCatalog);

// Orders
router.get('/orders', uniformController.listOrders);
router.post('/orders', validateRequest({ body: createOrderSchema }), uniformController.createOrder);
router.put('/orders/:id', validateRequest({ body: updateUniformSchema }), uniformController.updateOrder);
router.patch('/orders/:id/deliver', uniformController.markDelivered);
router.delete('/orders/:id', uniformController.deleteOrder);

export default router;
