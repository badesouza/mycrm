import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

// Use the same JWT secret as the middleware
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-here';

if (!process.env.JWT_SECRET) {
  console.warn('Warning: Using fallback JWT secret. Please set JWT_SECRET in your environment variables.');
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Token generated:', token.substring(0, 10) + '...');

    const response = {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 