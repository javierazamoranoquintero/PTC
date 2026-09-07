import dayjs from 'dayjs';
import { Op } from 'sequelize';
import { Reserva, Noticia, Torneo, EscalerillaPosicion } from '../models/index.js';

/**
 * "Panel General": la portada del panel de administración. Muestra un
 * resumen rápido (KPIs) de las 4 áreas que gestiona un admin — Reservas,
 * Escalerilla, Torneos y Noticias — con accesos directos a cada una.
 *
 * Importante: estos números salen de contar filas reales en la base de
 * datos (Reserva.count, etc), no son datos de ejemplo como en el mockup
 * original de Stitch.
 */
export const mostrarDashboard = async (req, res, next) => {
    try {
        const hoy = dayjs().format('YYYY-MM-DD');

        // Promise.all para pedir los 4 conteos al mismo tiempo, en vez de uno
        // por uno: son consultas independientes entre sí, así que no hay
        // motivo para hacer esperar a las demás mientras termina la primera.
        const [reservasHoy, totalJugadoresEscalerilla, torneosActivos, totalNoticias] = await Promise.all([
            Reserva.count({ where: { fecha: hoy, estado: 'confirmada' } }),
            EscalerillaPosicion.count(),
            Torneo.count({ where: { fecha: { [Op.gte]: hoy } } }),
            Noticia.count(),
        ]);

        res.render('admin/dashboard', {
            title: 'Panel de Administración',
            nombreClub: 'PTC - Pichilemu Tennis Club',
            paginaActual: 'general',
            kpis: { reservasHoy, totalJugadoresEscalerilla, torneosActivos, totalNoticias },
        });
    } catch (error) {
        next(error);
    }
};