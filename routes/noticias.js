import express from 'express';
import { mostrarNoticias } from '../controllers/noticiaController.js';

const router = express.Router();

router.get('/', mostrarNoticias);

export default router;