import { Router } from 'express';
import vacationController from '../controllers/vacationController';
import { verifyToken, requireAdmin } from '../middlewares/authMiddleware';
import multer from 'multer';
import path from 'path';

const uploadDir = process.env.UPLOAD_DIR ?? 'public/uploads';
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', uploadDir)),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage });
const router = Router();

router.get('/', verifyToken, vacationController.getAllVacations);
router.get('/report', verifyToken, requireAdmin, vacationController.getReport);
router.get('/:id', verifyToken, vacationController.getVacationById);
router.post('/', verifyToken, requireAdmin, upload.single('coverImage'), vacationController.createVacation);
router.put('/:id', verifyToken, requireAdmin, upload.single('coverImage'), vacationController.updateVacation);
router.delete('/:id', verifyToken, requireAdmin, vacationController.deleteVacation);
router.post('/:id/like', verifyToken, vacationController.toggleLike);
router.get('/:id/likes', verifyToken, vacationController.getLikesForVacation);

export default router;
