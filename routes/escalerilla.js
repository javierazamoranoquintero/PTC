import express from 'express';
import { mostrarEscalerilla } from '../controllers/escalerillaController.js';

const router = express.Router();

router.get('/', mostrarEscalerilla);

export default router;