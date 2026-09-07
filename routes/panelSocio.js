import express from 'express';
import { requiereLogin } from '../middlewares/auth.js';
import {
    mostrarPanelSocio,
    mostrarEditarPerfil,
    manejarSubidaFotoPerfil,
    actualizarPerfil,
    cancelarReservaControlador,
} from '../controllers/panelSocioController.js';

const router = express.Router();

// Todas las rutas de este archivo son privadas: sin sesión activa, van
// directo al login. Se pone una sola vez acá arriba (con router.use) en vez
// de repetir requiereLogin en cada ruta.
router.use(requiereLogin);

router.get('/', mostrarPanelSocio);

router.get('/editar-perfil', mostrarEditarPerfil);
router.post('/editar-perfil', manejarSubidaFotoPerfil, actualizarPerfil);

router.post('/reservas/:id/cancelar', cancelarReservaControlador);

export default router;