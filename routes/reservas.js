import express from 'express';
import { requiereLogin } from '../middlewares/auth.js';
const router = express.Router();

// requiereLogin va ANTES del controlador: si no hay sesión activa, ni
// siquiera llega a ejecutarse la función de abajo, se manda directo al login.
router.get('/', requiereLogin, (req, res) => {
    res.send('Módulo en construcción');
});

export default router;