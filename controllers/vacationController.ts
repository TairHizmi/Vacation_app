import { Request, Response } from 'express';
import db from '../services/dbService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface VacationRow {
  id: number;
  destination: string;
  description: string;
  start_date: string;
  end_date: string;
  price: number | string;
  cover_image_filename: string | null;
  created_at?: string;
  likes_count: number;
  liked_by_me: number;
}

interface VacationResponse {
  id: number;
  destination: string;
  description: string;
  startDate: string;
  endDate: string;
  price: number;
  coverImageFilename: string | null;
  createdAt?: string;
  likesCount: number;
  likedByMe: boolean;
}

interface VacationListResponse {
  vacations: VacationResponse[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

interface VacationCreateRequestBody {
  destination?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  price?: string | number;
}

interface VacationLikeResponse {
  liked: boolean;
  likesCount: number;
}

interface CountRow {
  total: number;
}

type VacationFilter = 'all' | 'liked' | 'active' | 'upcoming';

const pageSize = 9;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const parsePage = (value: string | undefined): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const parseFilter = (value: unknown): VacationFilter => {
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (normalized === 'liked' || normalized === 'active' || normalized === 'upcoming') {
      return normalized;
    }
  }
  return 'all';
};

const mapVacationRow = (row: VacationRow): VacationResponse => ({
  id: row.id,
  destination: row.destination,
  description: row.description,
  startDate: row.start_date,
  endDate: row.end_date,
  price: Number(row.price),
  coverImageFilename: row.cover_image_filename,
  likesCount: Number(row.likes_count ?? 0),
  likedByMe: Number(row.liked_by_me ?? 0) > 0,
  ...(row.created_at ? { createdAt: row.created_at } : {}),
});

const validateVacationDates = (startDate: string, endDate: string, requireFutureStart = false) => {
  if (!datePattern.test(startDate) || !datePattern.test(endDate)) {
    throw new Error('Dates must use the YYYY-MM-DD format.');
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Invalid date values.');
  }

  if (end < start) {
    throw new Error('End date cannot be earlier than start date.');
  }

  if (requireFutureStart && start < todayStart) {
    throw new Error('Vacation start date cannot be in the past.');
  }
};

const getAllVacations = async (req: AuthenticatedRequest, res: Response<VacationListResponse | { error: string }>) => {
  try {
    const currentUserId = req.user?.id ?? 0;
    const filter = parseFilter(req.query.filter);
    const page = parsePage(typeof req.query.page === 'string' ? req.query.page : undefined);

    const numericLimit = parseInt(String(pageSize), 10) || 9;
    const numericPage = parseInt(String(page), 10) || 1;
    const numericOffset = (numericPage - 1) * numericLimit;

    const whereClauses: string[] = [];
    const countParams: Array<number> = [];

    if (filter === 'liked') {
      whereClauses.push('EXISTS (SELECT 1 FROM likes l2 WHERE l2.vacation_id = v.id AND l2.user_id = ?)');
      countParams.push(currentUserId);
    }

    if (filter === 'active') {
      whereClauses.push('v.start_date <= CURDATE() AND v.end_date >= CURDATE()');
    } else if (filter === 'upcoming') {
      whereClauses.push('v.start_date > CURDATE()');
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const countQuery = `SELECT COUNT(*) AS total FROM vacations v ${whereClause}`;
    const countRows = await db.query<CountRow[]>(countQuery, countParams);
    const totalItems = Number(countRows[0]?.total ?? 0);

    const sql = `
      SELECT
        v.id,
        v.destination,
        v.description,
        v.start_date,
        v.end_date,
        v.price,
        v.cover_image_filename,
        v.created_at,
        COUNT(l.user_id) AS likes_count,
        SUM(CASE WHEN l.user_id = ? THEN 1 ELSE 0 END) AS liked_by_me
      FROM vacations v
      LEFT JOIN likes l ON v.id = l.vacation_id
      ${whereClause}
      GROUP BY v.id
      ORDER BY v.start_date ASC
      LIMIT ${numericLimit} OFFSET ${numericOffset}
    `;

    const vacations = await db.query<VacationRow[]>(sql, filter === 'liked' ? [currentUserId, currentUserId] : [currentUserId]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    res.json({
      vacations: vacations.map(mapVacationRow),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Vacation Fetch Error:', error);
    res.status(500).json({ error: 'Unable to retrieve vacations.' });
  }
};

const getVacationById = async (req: AuthenticatedRequest, res: Response<VacationResponse | { error: string }>) => {
  try {
    const vacationId = String(req.params.id);
    const userId = req.user?.id ?? 0;
    const vacations = await db.query<VacationRow[]>(`
      SELECT
        v.id,
        v.destination,
        v.description,
        v.start_date,
        v.end_date,
        v.price,
        v.cover_image_filename,
        v.created_at,
        COUNT(l.user_id) AS likes_count,
        SUM(CASE WHEN l.user_id = ? THEN 1 ELSE 0 END) AS liked_by_me
      FROM vacations v
      LEFT JOIN likes l ON v.id = l.vacation_id
      WHERE v.id = ?
      GROUP BY v.id
    `, [userId, vacationId]);
    const vacation = vacations[0];
    if (!vacation) {
      return res.status(404).json({ error: 'Vacation not found.' });
    }
    res.json(mapVacationRow(vacation));
  } catch (error) {
    console.error('Get vacation by id error:', error);
    res.status(500).json({ error: 'Unable to retrieve vacation.' });
  }
};

const createVacation = async (req: AuthenticatedRequest, res: Response<VacationResponse | { error: string }>) => {
  try {
    const { destination, description, startDate, endDate, price } = req.body as VacationCreateRequestBody;
    const coverImageFilename = (req.file as Express.Multer.File | undefined)?.filename ?? null;

    if (!destination || !description || !startDate || !endDate || price === undefined || price === null) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const normalizedDestination = destination.trim();
    const normalizedDescription = description.trim();
    const numericPrice = Number(price);

    if (!normalizedDestination || !normalizedDescription) {
      return res.status(400).json({ error: 'Destination and description are required.' });
    }

    if (Number.isNaN(numericPrice) || numericPrice < 0 || numericPrice > 10000) {
      return res.status(400).json({ error: 'Price must be between 0 and 10,000.' });
    }

    validateVacationDates(startDate, endDate, true);

    const result = await db.query<{ insertId: number }>(
      'INSERT INTO vacations (destination, description, start_date, end_date, price, cover_image_filename) VALUES (?, ?, ?, ?, ?, ?)',
      [normalizedDestination, normalizedDescription, startDate, endDate, numericPrice, coverImageFilename]
    );

    const createdVacations = await db.query<VacationRow[]>(`
      SELECT
        v.id,
        v.destination,
        v.description,
        v.start_date,
        v.end_date,
        v.price,
        v.cover_image_filename,
        v.created_at,
        0 AS likes_count,
        0 AS liked_by_me
      FROM vacations v
      WHERE v.id = ?
    `, [result.insertId]);

    const createdVacation = createdVacations[0];
    if (!createdVacation) {
      return res.status(500).json({ error: 'Unable to retrieve created vacation.' });
    }

    res.status(201).json(mapVacationRow(createdVacation));
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Create vacation error:', error);
    res.status(500).json({ error: 'Unable to create vacation.' });
  }
};

const updateVacation = async (req: AuthenticatedRequest, res: Response<VacationResponse | { error: string }>) => {
  try {
    const { destination, description, startDate, endDate, price } = req.body as VacationCreateRequestBody;
    const vacationId = String(req.params.id);
    const existingVacations = await db.query<VacationRow[]>('SELECT * FROM vacations WHERE id = ?', [vacationId]);
    const existingVacation = existingVacations[0];

    if (!existingVacation) {
      return res.status(404).json({ error: 'Vacation not found.' });
    }

    if (!destination || !description || !startDate || !endDate || price === undefined || price === null) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const normalizedDestination = destination.trim();
    const normalizedDescription = description.trim();
    const numericPrice = Number(price);

    if (!normalizedDestination || !normalizedDescription) {
      return res.status(400).json({ error: 'Destination and description are required.' });
    }

    if (Number.isNaN(numericPrice) || numericPrice < 0 || numericPrice > 10000) {
      return res.status(400).json({ error: 'Price must be between 0 and 10,000.' });
    }

    validateVacationDates(startDate, endDate, false);

    const coverImageFilename = (req.file as Express.Multer.File | undefined)?.filename ?? existingVacation.cover_image_filename;
    const updateFields: Array<string | number | null> = [normalizedDestination, normalizedDescription, startDate, endDate, numericPrice, coverImageFilename, vacationId];

    await db.query(
      'UPDATE vacations SET destination = ?, description = ?, start_date = ?, end_date = ?, price = ?, cover_image_filename = ? WHERE id = ?',
      updateFields
    );

    const updatedVacations = await db.query<VacationRow[]>(`
      SELECT
        v.id,
        v.destination,
        v.description,
        v.start_date,
        v.end_date,
        v.price,
        v.cover_image_filename,
        v.created_at,
        COUNT(l.user_id) AS likes_count,
        SUM(CASE WHEN l.user_id = ? THEN 1 ELSE 0 END) AS liked_by_me
      FROM vacations v
      LEFT JOIN likes l ON v.id = l.vacation_id
      WHERE v.id = ?
      GROUP BY v.id
    `, [req.user?.id ?? 0, vacationId]);

    const updatedVacation = updatedVacations[0];
    if (!updatedVacation) {
      return res.status(404).json({ error: 'Vacation not found.' });
    }

    res.json(mapVacationRow(updatedVacation));
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Update vacation error:', error);
    res.status(500).json({ error: 'Unable to update vacation.' });
  }
};

const deleteVacation = async (req: Request, res: Response<{ message: string } | { error: string }>) => {
  try {
    const vacationId = String(req.params.id);
    const result = await db.query<{ affectedRows: number }>('DELETE FROM vacations WHERE id = ?', [vacationId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Vacation not found.' });
    }
    res.json({ message: 'Vacation deleted successfully.' });
  } catch (error) {
    console.error('Delete vacation error:', error);
    res.status(500).json({ error: 'Unable to delete vacation.' });
  }
};

const toggleLike = async (req: AuthenticatedRequest, res: Response<VacationLikeResponse | { error: string }>) => {
  try {
    const vacationId = String(req.params.id);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const vacationRows = await db.query<VacationRow[]>('SELECT id FROM vacations WHERE id = ?', [vacationId]);
    if (vacationRows.length === 0) {
      return res.status(404).json({ error: 'Vacation not found.' });
    }

    const likes = await db.query<VacationRow[]>('SELECT * FROM likes WHERE user_id = ? AND vacation_id = ?', [userId, vacationId]);
    const existingLike = likes[0];

    if (existingLike) {
      await db.query('DELETE FROM likes WHERE user_id = ? AND vacation_id = ?', [userId, vacationId]);
    } else {
      await db.query('INSERT INTO likes (user_id, vacation_id) VALUES (?, ?)', [userId, vacationId]);
    }

    const likeCounts = await db.query<{ likes_count: number }[]>('SELECT COUNT(*) AS likes_count FROM likes WHERE vacation_id = ?', [vacationId]);
    const likesCount = Number(likeCounts[0]?.likes_count ?? 0);

    res.json({ liked: !existingLike, likesCount });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: 'Unable to toggle like.' });
  }
};

const getLikesForVacation = async (req: Request, res: Response<{ likesCount: number } | { error: string }>) => {
  try {
    const vacationId = String(req.params.id);
    const likes = await db.query<{ likes_count: number }[]>('SELECT COUNT(*) AS likes_count FROM likes WHERE vacation_id = ?', [vacationId]);
    res.json({ likesCount: Number(likes[0]?.likes_count ?? 0) });
  } catch (error) {
    console.error('Get likes error:', error);
    res.status(500).json({ error: 'Unable to retrieve likes.' });
  }
};

const getReport = async (_req: Request, res: Response<Array<{ destination: string; likes: number }> | { error: string }>) => {
  try {
    const report = await db.query<{ destination: string; likes: number }[]>(`
      SELECT v.destination, COUNT(l.user_id) AS likes
      FROM vacations v
      LEFT JOIN likes l ON v.id = l.vacation_id
      GROUP BY v.id
      ORDER BY likes DESC
    `);
    res.json(report);
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Unable to retrieve report.' });
  }
};

export default {
  getAllVacations,
  getVacationById,
  createVacation,
  updateVacation,
  deleteVacation,
  toggleLike,
  getLikesForVacation,
  getReport,
};
