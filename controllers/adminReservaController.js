import dayjs from 'dayjs';
import 'dayjs/locale/es.js';
import { Reserva, Usuario, Cancha } from '../models/index.js';
import { cancelarReservaComoAdmin } from '../services/reservaService.js';
import { registrarActividad } from '../helpers/logger.js';

/**
 * Muestra las reservas de HOY para que el admin pueda revisarlas y, si
 * hace falta, cancelar alguna a mano (ej: un socio avisó por teléfono que
 * no puede ir). Por ahora solo muestra "hoy" — no hay selector de fecha
 * todavía; se puede agregar más adelante si se necesita.
 */
export const mostrarReservasAdmin = async (req, res, next) => {
    try {
        const hoy = dayjs();

        const reservas = await Reserva.findAll({
            where: { fecha: hoy.format('YYYY-MM-DD'), estado: 'confirmada' },
            include: [
                { model: Usuario, attributes: ['id', 'nombre', 'email'] },
                { model: Cancha, attributes: ['id', 'nombre', 'tipo'] },
            ],
            order: [['horaInicio', 'ASC']],
        });

        // dayjs en español devuelve el día en minúscula ("lunes 7 de
        // septiembre"); esta línea solo pone en mayúscula la primera letra,
        // para que se vea bien como subtítulo (ver el comentario en
        // partials/encabezadoSeccion.ejs sobre por qué no se usa la clase
        // "capitalize" de Tailwind acá).
        const fechaSinFormatoDeTitulo = hoy.locale('es').format('dddd D [de] MMMM');
        const fechaFormateada = fechaSinFormatoDeTitulo.charAt(0).toUpperCase() + fechaSinFormatoDeTitulo.slice(1);

        res.render('admin/reservas', {
            title: 'Gestión de Canchas',
            nombreClub: 'PTC - Pichilemu Tennis Club',
            paginaActual: 'reservas',
            fechaFormateada,
            reservas,
            mensaje: req.query.error || null,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Cancela una reserva desde el panel admin. A diferencia de cuando un
 * socio cancela su propia reserva (que exige ser el dueño y respetar las
 * 24 horas de anticipación), acá el club puede cancelar CUALQUIER
 * reserva en cualquier momento — ver cancelarReservaComoAdmin en
 * reservaService.js para el detalle de esa diferencia.
 */
export const cancelarReservaAdminControlador = async (req, res, next) => {
    try {
        await cancelarReservaComoAdmin({ reservaId: req.params.id });
        registrarActividad(`🎾 ADMIN: Reserva #${req.params.id} cancelada manualmente.`);
        res.redirect('/admin/reservas');
    } catch (error) {
        // Errores esperables de negocio (la reserva no existe, o ya no
        // estaba activa) no deberían mostrar la pantalla de error genérica
        // del sistema: se vuelve a la misma lista con un aviso claro.
        if (error.message === 'Esa reserva no existe.' || error.message === 'Esta reserva ya no está activa.') {
            return res.redirect(`/admin/reservas?error=${encodeURIComponent(error.message)}`);
        }
        next(error);
    }
};