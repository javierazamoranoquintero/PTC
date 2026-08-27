import { Cancha } from '../models/index.js';
import { cerrarCancha } from '../services/cierreCanchaService.js';
import { registrarActividad } from '../helpers/logger.js';

/**
 * Muestra el formulario para crear un cierre de cancha (solo admin).
 */
export const mostrarFormularioCierre = async (req, res, next) => {
    try {
        const canchas = await Cancha.findAll({ order: [['nombre', 'ASC']] });
        res.render('admin/cierres/nuevo', {
            title: 'Cerrar cancha',
            canchas,
            error: null,
            valores: { canchaId: '', fechaHoraInicio: '', fechaHoraFin: '', motivo: '' },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Procesa el formulario: valida los datos, y ejecuta el cierre (una vez
 * por cada cancha seleccionada, o por todas si se eligió esa opción).
 */
export const crearCierre = async (req, res, next) => {
    const { canchaId, fechaHoraInicio, fechaHoraFin, motivo } = req.body;

    // Pequeño helper para no repetir "volver a buscar las canchas y
    // renderizar el formulario con el error" en cada validación.
    const volverConError = async (mensajeError) => {
        const canchas = await Cancha.findAll({ order: [['nombre', 'ASC']] });
        return res.status(400).render('admin/cierres/nuevo', {
            title: 'Cerrar cancha',
            canchas,
            error: mensajeError,
            valores: { canchaId, fechaHoraInicio, fechaHoraFin, motivo },
        });
    };

    try {
        if (!canchaId || !fechaHoraInicio || !fechaHoraFin || !motivo) {
            return await volverConError('Todos los campos son obligatorios.');
        }

        if (new Date(fechaHoraFin) <= new Date(fechaHoraInicio)) {
            return await volverConError('La fecha/hora de fin debe ser posterior a la de inicio.');
        }

        // "todas" cierra cada cancha del club por separado, con el mismo
        // rango y motivo (así lo definimos en el diseño de datos: no existe
        // un "cierre general", son varios cierres individuales).
        let canchaIds;
        if (canchaId === 'todas') {
            const todasLasCanchas = await Cancha.findAll({ attributes: ['id'] });
            canchaIds = todasLasCanchas.map((c) => c.id);
        } else {
            canchaIds = [Number(canchaId)];
        }

        const totales = { reservasCanceladas: 0, clasesCanceladas: 0, notificacionesCreadas: 0 };

        for (const id of canchaIds) {
            const resultado = await cerrarCancha({
                canchaId: id,
                fechaHoraInicio,
                fechaHoraFin,
                motivo,
            });
            totales.reservasCanceladas += resultado.reservasCanceladas;
            totales.clasesCanceladas += resultado.clasesCanceladas;
            totales.notificacionesCreadas += resultado.notificacionesCreadas;
        }

        registrarActividad(
            `🔒 ADMIN: Cierre de cancha creado (canchas: ${canchaIds.join(', ')}, motivo: "${motivo}"). ` +
            `Reservas canceladas: ${totales.reservasCanceladas}, clases canceladas: ${totales.clasesCanceladas}, ` +
            `notificaciones enviadas: ${totales.notificacionesCreadas}.`
        );

        res.render('admin/cierres/resultado', {
            title: 'Cierre registrado',
            cantidadCanchas: canchaIds.length,
            totales,
        });
    } catch (error) {
        next(error);
    }
};