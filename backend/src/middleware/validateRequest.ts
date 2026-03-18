/**
 * Zod validation middleware.
 * Validates request body, query, or params against a Zod schema.
 * Returns 400 with validation details on failure.
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/apiResponse.js';

interface ValidationSchemas {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}

export function validateRequest(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const errors: Record<string, string[]> = {};

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        errors.body = result.error.issues.map(
          (issue) => `${issue.path.join('.')}: ${issue.message}`
        );
      } else {
        req.body = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        errors.query = result.error.issues.map(
          (issue) => `${issue.path.join('.')}: ${issue.message}`
        );
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        errors.params = result.error.issues.map(
          (issue) => `${issue.path.join('.')}: ${issue.message}`
        );
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', errors);
    }

    next();
  };
}
