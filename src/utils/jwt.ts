import jwt, { SignOptions } from 'jsonwebtoken';
import env from '../config/env';

interface TokenPayload {
  id: number;
  username: string;
  role?: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = async (token: string): Promise<TokenPayload> => {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    return payload;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}; 