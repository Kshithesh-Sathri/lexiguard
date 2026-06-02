import express from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import {
  analyzeText,
  getHistory,
  simplifyClause,
  analyzePDF,
  compareDocuments
} from '../controllers/analyzecontroller.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'));
  }
});

// BUG FIX: multer error handler so bad uploads return proper JSON
function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
}

router.use(authMiddleware);

router.post('/analyze', analyzeText);
router.get('/history', getHistory);
router.post('/simplify', simplifyClause);
router.post('/analyze-pdf', upload.single('pdf'), handleMulterError, analyzePDF);
router.post('/compare', compareDocuments);
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

export default router;
