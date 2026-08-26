import express from 'express';
import { requiereLogin, requiereAdmin } from '../middlewares/auth.js';
const router = express.Router();

// Dos middlewares en cadena: primero se confirma que haya sesión
// (requiereLogin), y solo si eso pasa se revisa el rol (requiereAdmin).
router.get('/', requiereLogin, requiereAdmin, (req, res) => {
    res.send('Módulo en construcción');
});

export default router;