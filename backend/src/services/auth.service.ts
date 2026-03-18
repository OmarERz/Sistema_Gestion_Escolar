/**
 * Authentication service.
 * Handles login credential verification and JWT token generation.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/apiResponse.js';
import type { AuthPayload } from '../middleware/auth.js';

export async function login(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !user.isActive) {
    throw new AppError(401, 'Invalid credentials', 'AUTH_INVALID_CREDENTIALS');
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);

  if (!validPassword) {
    throw new AppError(401, 'Invalid credentials', 'AUTH_INVALID_CREDENTIALS');
  }

  const payload: AuthPayload = {
    userId: user.id,
    username: user.username,
  };

  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
    },
  };
}

export async function getAuthenticatedUser(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      fullName: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError(401, 'User not found or inactive', 'AUTH_USER_NOT_FOUND');
  }

  return user;
}
