/**
 * Auth controller.
 * Handles login and current user info requests.
 */

import { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import { successResponse } from '../utils/apiResponse.js';
import type { LoginInput } from '../schemas/auth.schema.js';

export async function login(req: Request, res: Response) {
  const { username, password } = req.body as LoginInput;
  const result = await authService.login(username, password);
  successResponse(res, result);
}

export async function me(req: Request, res: Response) {
  const user = await authService.getAuthenticatedUser(req.user!.userId);
  successResponse(res, user);
}
