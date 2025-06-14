import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    status: string;
  };
}

// Use the same JWT secret as in the login route
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-here';

if (!process.env.JWT_SECRET) {
  console.warn('Warning: Using fallback JWT secret. Please set JWT_SECRET in your environment variables.');
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    console.log('Auth Header:', authHeader);

    if (!authHeader) {
      console.log('No authorization header');
      return res.status(401).json({ message: 'No authorization header' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    console.log('Token:', token.substring(0, 10) + '...');

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        console.error('Token verification error:', err);
        return res.status(403).json({ message: 'Invalid token' });
      }

      console.log('Decoded token:', decoded);

      if (!decoded.id) {
        console.error('No user ID in token');
        return res.status(403).json({ message: 'Invalid token format' });
      }

      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        status: decoded.status
      };

      console.log('User authenticated:', req.user);
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
}; 