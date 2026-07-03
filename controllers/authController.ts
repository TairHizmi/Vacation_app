import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import db from '../services/dbService';

interface UserRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: string;
}

interface UserSummary {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface RegisterRequestBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: string;
}

interface LoginRequestBody {
  email?: string;
  password?: string;
}

interface AuthResponse {
  user: UserSummary;
  token: string;
}

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required');
}

const jwtSecretValue: jwt.Secret = jwtSecret;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createToken = (user: Pick<UserRow, 'id' | 'email' | 'first_name' | 'last_name' | 'role'>) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
    },
    jwtSecretValue,
    {
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
    } as jwt.SignOptions
  );
};

const mapUserToSummary = (user: UserRow): UserSummary => ({
  id: user.id,
  firstName: user.first_name,
  lastName: user.last_name,
  email: user.email,
  role: user.role,
});

const register = async (req: Request, res: Response<AuthResponse | { error: string }>) => {
  try {
    const { firstName, lastName, email, password, role } = req.body as RegisterRequestBody;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedFirstName || !normalizedLastName) {
      return res.status(400).json({ error: 'First and last names are required.' });
    }

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters.' });
    }

    const existingUsers = await db.query<UserRow[]>('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [normalizedEmail]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Email is already taken.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedRole = role === 'Admin' ? 'Admin' : 'User';

    const result = await db.query<{ insertId: number }>(
      'INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [normalizedFirstName, normalizedLastName, normalizedEmail, hashedPassword, normalizedRole]
    );

    const createdUsers = await db.query<UserRow[]>('SELECT id, first_name, last_name, email, role FROM users WHERE id = ?', [result.insertId]);
    const createdUser = createdUsers[0];
    if (!createdUser) {
      return res.status(500).json({ error: 'Unable to retrieve created user.' });
    }

    const token = createToken(createdUser);
    res.status(201).json({ user: mapUserToSummary(createdUser), token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Unable to register user.' });
  }
};

const login = async (req: Request, res: Response<AuthResponse | { error: string }>) => {
  try {
    const { email, password } = req.body as LoginRequestBody;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const users = await db.query<UserRow[]>('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [normalizedEmail]);
    const user = users[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = createToken(user);
    res.json({ user: mapUserToSummary(user), token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Unable to login.' });
  }
};

export default {
  register,
  login,
};
