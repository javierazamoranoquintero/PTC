import express from 'express';
import {
    mostrarRegistro,
    registrar,
    mostrarLogin,
    iniciarSesion,
    cerrarSesion,
} from '../controllers/autenticacionController.js';
import { redirigeSiYaLogueado } from '../middlewares/auth.js';

const router = express.Router();

// GET muestra el formulario, POST procesa lo que se envió. Es el patrón
// estándar en Express para cualquier formulario.
router.get('/registro', redirigeSiYaLogueado, mostrarRegistro);
router.post('/registro', redirigeSiYaLogueado, registrar);

router.get('/login', redirigeSiYaLogueado, mostrarLogin);
router.post('/login', redirigeSiYaLogueado, iniciarSesion);

// POST (no GET) para cerrar sesión: así un simple link o una imagen en
// otra página no puede desloguear a alguien sin que lo sepa.
router.post('/logout', cerrarSesion);

export default router;