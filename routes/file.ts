import { Router } from 'express';
import { uploadFile, handleFileUpload } from '../controllers/uploadController';

const router = Router();

router.post('/upload', uploadFile, (req, res, next) => {
    handleFileUpload(req, res).catch(next);
});

export default router;
