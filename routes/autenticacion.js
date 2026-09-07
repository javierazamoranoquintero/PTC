import express from 'express';
import {
    mostrarRegistro,
    registrar,
    manejarSubidaFotoRegistro,
    mostrarLogin,
    iniciarSesion,
    cerrarSesion,
} from '../controllers/autenticacionController.js';
import { redirigeSiYaLogueado } from '../middlewares/auth.js';

const router = express.Router();

// GET muestra el formulario, POST procesa lo que se envió. Es el patrón
// estándar en Express para cualquier formulario.
// manejarSubidaFotoRegistro va ANTES de "registrar": primero se procesa el
// archivo de la foto (y se valida su tipo/tamaño), y solo si eso sale bien
// se ejecuta la validación del resto del formulario.
router.get('/registro', redirigeSiYaLogueado, mostrarRegistro);
router.post('/registro', redirigeSiYaLogueado, manejarSubidaFotoRegistro, registrar);

router.get('/login', redirigeSiYaLogueado, mostrarLogin);
router.post('/login', redirigeSiYaLogueado, iniciarSesion);

// POST (no GET) para cerrar sesión: así un simple link o una imagen en
// otra página no puede desloguear a alguien sin que lo sepa.
router.post('/logout', cerrarSesion);

export default router;