import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import schoolCycleRoutes from './routes/schoolCycle.routes.js';
import groupRoutes from './routes/group.routes.js';
import studentRoutes from './routes/student.routes.js';
import guardianRoutes from './routes/guardian.routes.js';
import paymentConceptRoutes from './routes/paymentConcept.routes.js';
import paymentMethodRoutes from './routes/paymentMethod.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import recurringRuleRoutes from './routes/recurringRule.routes.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Sistema de Gestión API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/school-cycles', schoolCycleRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/guardians', guardianRoutes);
app.use('/api/payment-concepts', paymentConceptRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/recurring-rules', recurringRuleRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
