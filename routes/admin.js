import express from 'express';
import { requiereLogin, requiereAdmin } from '../middlewares/auth.js';
import { mostrarFormularioCierre, crearCierre } from '../controllers/cierreCanchaController.js';
import { mostrarFormularioTorneo, crearTorneo } from '../controllers/torneoController.js';

const router = express.Router();

// Todas las rutas de este router son exclusivas para administradores.
// Antes repetíamos "requiereLogin, requiereAdmin" en cada ruta; con
// router.use() los aplicamos UNA sola vez y quedan protegidas todas las
// rutas que se definan debajo, sin tener que acordarse de repetirlos.
router.use(requiereLogin, requiereAdmin);

router.get('/', (req, res) => {
    res.send('Módulo en construcción');
});

router.get('/cierres/nuevo', mostrarFormularioCierre);
router.post('/cierres', crearCierre);

router.get('/torneos/nuevo', mostrarFormularioTorneo);
router.post('/torneos', crearTorneo);

export default router;