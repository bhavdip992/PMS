import jwt from 'jsonwebtoken';
import { JwtPayload, IUser } from '../types/index.js';

export const generateAccessToken = (user: Pick<IUser, '_id' | 'role' | 'email'>): string => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: '15m' }
  );
};

export const generateRefreshToken = (user: Pick<IUser, '_id'>): string => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: '7d' }
  );
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as JwtPayload;
};
