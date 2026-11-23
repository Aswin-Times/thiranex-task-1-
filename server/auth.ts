import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET || 'taskflow-local-development-secret';

export interface AuthenticatedRequest extends Request {
  userId: string;
}

export function signToken(userId: string) {
  return jwt.sign({ sub: userId }, jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string): string {
  const payload = jwt.verify(token, jwtSecret);
  if (typeof payload === 'string' || !payload.sub) throw new Error('Invalid token');
  return payload.sub;
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return response.status(401).json({ message: 'Authentication required.' });

  try {
    (request as AuthenticatedRequest).userId = verifyToken(token);
    next();
  } catch {
    response.status(401).json({ message: 'Your session is invalid or has expired.' });
  }
}

