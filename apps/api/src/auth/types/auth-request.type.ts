import { Request } from 'express';
import { Role } from '@prisma/client';

// This is based on the UserResponse type in AuthService
// and the return type of the validateUser method.
export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string | null;
  fullName: string;
  role: Role;
  isActive: boolean;
  domainId: string | null;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user: AuthenticatedUser;
}
