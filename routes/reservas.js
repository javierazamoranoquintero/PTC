import express from 'express';
import { requiereLogin } from '../middlewares/auth.js';
import { mostrarReservas, crearReservaControlador } from '../controllers/reservaController.js';
const router = express.Router();

// GET es público: cualquier visitante puede ver qué horarios están libres u
// ocupados (objetivo original del proyecto: "visualización pública de
// disponibilidad"). requiereLogin solo se exige al CREAR una reserva (POST):
// si alguien sin sesión intenta reservar, ahí sí se le manda a login.
router.get('/', mostrarReservas);
router.post('/', requiereLogin, crearReservaControlador);

export default router;