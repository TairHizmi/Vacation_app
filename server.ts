import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import vacationRoutes from './routes/vacationRoutes';
import mcpRoutes from './routes/mcpRoutes';

dotenv.config();

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'public/uploads';
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, UPLOAD_DIR)));

app.use('/api/auth', authRoutes);
app.use('/api/vacations', vacationRoutes);
app.use('/api/mcp', mcpRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Vacation Management API is running' });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Server error' });
});

const port = Number(process.env.PORT ?? 5000);
fs.mkdirSync(path.resolve(__dirname, UPLOAD_DIR), { recursive: true });

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
