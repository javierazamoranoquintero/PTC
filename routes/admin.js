import express from 'express';
import { requiereLogin, requiereAdmin } from '../middlewares/auth.js';
import { mostrarDashboard } from '../controllers/adminController.js';
import { mostrarFormularioCierre, crearCierre } from '../controllers/cierreCanchaController.js';
import { mostrarFormularioTorneo, crearTorneo } from '../controllers/torneoController.js';
import {
    mostrarFormularioNoticias,
    mostrarFormularioEditarNoticia,
    manejarSubidaImagenNoticia,
    crearNoticia,
    actualizarNoticia,
    eliminarNoticia,
} from '../controllers/noticiaController.js';
import { mostrarReservasAdmin, cancelarReservaAdminControlador } from '../controllers/adminReservaController.js';
import {
    mostrarEscalerillaAdmin,
    agregarJugadorEscalerilla,
    actualizarPosicionEscalerilla,
    quitarJugadorEscalerilla,
} from '../controllers/escalerillaController.js';

const router = express.Router();

// Todas las rutas de este router son exclusivas para administradores.
// Antes repetíamos "requiereLogin, requiereAdmin" en cada ruta; con
// router.use() los aplicamos UNA sola vez y quedan protegidas todas las
// rutas que se definan debajo, sin tener que acordarse de repetirlos.
router.use(requiereLogin, requiereAdmin);

// "Panel General": portada del panel de administración, con el sidebar de
// navegación hacia las demás secciones (ver views/admin/partials/sidebar.ejs).
router.get('/', mostrarDashboard);

router.get('/cierres/nuevo', mostrarFormularioCierre);
router.post('/cierres', crearCierre);

router.get('/torneos/nuevo', mostrarFormularioTorneo);
router.post('/torneos', crearTorneo);

// CRUD de Noticias. "manejarSubidaImagenNoticia" va SIEMPRE antes del
// controlador real, tanto para crear como para editar: es el que procesa
// el archivo de imagen (si se subió alguno) antes de que crearNoticia o
// actualizarNoticia intenten leer req.body / req.file.
router.get('/noticias', mostrarFormularioNoticias);
router.post('/noticias', manejarSubidaImagenNoticia, crearNoticia);
router.get('/noticias/:id/editar', mostrarFormularioEditarNoticia);
router.post('/noticias/:id', manejarSubidaImagenNoticia, actualizarNoticia);
router.post('/noticias/:id/eliminar', eliminarNoticia);

// Gestión de reservas del día (cancelación manual por el club).
router.get('/reservas', mostrarReservasAdmin);
router.post('/reservas/:id/cancelar', cancelarReservaAdminControlador);

// Gestión manual de la Escalerilla (agregar, reordenar, quitar).
router.get('/escalerilla', mostrarEscalerillaAdmin);
router.post('/escalerilla', agregarJugadorEscalerilla);
router.post('/escalerilla/:usuarioId/actualizar', actualizarPosicionEscalerilla);
router.post('/escalerilla/:usuarioId/quitar', quitarJugadorEscalerilla);

export default router;