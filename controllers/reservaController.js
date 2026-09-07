import dayjs from 'dayjs';
import 'dayjs/locale/es.js';
import { Cancha, BloqueOcupado } from '../models/index.js';
import {
    crearReserva,
    generarHorariosDeInicio,
    DURACIONES_DISPONIBLES,
    MAX_DIAS_ANTICIPACION,
    HORAS_ANTICIPACION_MINIMA,
} from '../services/reservaService.js';
import { registrarActividad } from '../helpers/logger.js';

/**
 * Arma todos los datos que necesita la vista de Reservas para una fecha
 * dada: el selector de 14 días, la grilla de horarios de cada cancha (con
 * su estado: disponible / ocupado / pasado), y las duraciones del formulario.
 *
 * Se usa tanto para mostrar la página (GET) como para volver a mostrarla
 * con un error si falla la creación de una reserva (POST) — así no se
 * repite esta lógica en los dos lugares.
 */
async function construirDatosVista(fechaQuery) {
    const hoy = dayjs().startOf('day');
    const maxFecha = hoy.add(MAX_DIAS_ANTICIPACION, 'day');

    let fechaSeleccionada = dayjs(fechaQuery, 'YYYY-MM-DD', true);
    if (!fechaSeleccionada.isValid() || fechaSeleccionada.isBefore(hoy) || fechaSeleccionada.isAfter(maxFecha)) {
        // Si no mandaron fecha, o mandaron una fuera de rango (pasada, o más
        // allá de los 14 días permitidos), se cae de vuelta a hoy en vez de
        // mostrar un error — es más amigable para quien solo abrió la página.
        fechaSeleccionada = hoy;
    }
    const fechaSeleccionadaStr = fechaSeleccionada.format('YYYY-MM-DD');
    // Se arma acá (no en la vista) el texto "lunes 15 de septiembre" que
    // acompaña el nombre de cada cancha — mismo criterio que el resto del
    // proyecto: la vista solo pinta, no calcula ni formatea fechas.
    const fechaSeleccionadaFormateada = fechaSeleccionada.locale('es').format('dddd D [de] MMMM');

    // Selector horizontal de fechas: hoy + los próximos 14 días. Cada uno es
    // un link normal (no necesita JavaScript), así que recarga la página con
    // "?fecha=YYYY-MM-DD".
    const fechasDisponibles = [];
    for (let i = 0; i <= MAX_DIAS_ANTICIPACION; i += 1) {
        const dia = hoy.add(i, 'day');
        const valor = dia.format('YYYY-MM-DD');
        fechasDisponibles.push({
            valor,
            diaSemana: i === 0 ? 'Hoy' : dia.locale('es').format('ddd').toUpperCase(),
            diaNumero: dia.format('DD'),
            mesCorto: dia.locale('es').format('MMM').toUpperCase(),
            activa: valor === fechaSeleccionadaStr,
        });
    }

    const horariosPosibles = generarHorariosDeInicio();

    const canchas = await Cancha.findAll({ order: [['id', 'ASC']] });

    const bloquesOcupados = await BloqueOcupado.findAll({
        where: { fecha: fechaSeleccionadaStr },
    });
    // Set de "canchaId-horaInicio" para poder chequear al vuelo, sin tener
    // que recorrer el arreglo completo por cada horario de cada cancha.
    const ocupados = new Set(bloquesOcupados.map((bloque) => `${bloque.canchaId}-${bloque.horaInicio.slice(0, 5)}`));

    const ahora = dayjs();

    const canchasConHorarios = canchas.map((cancha) => ({
        id: cancha.id,
        nombre: cancha.nombre,
        tipo: cancha.tipo,
        horarios: horariosPosibles.map((horaInicio) => {
            let estado = 'disponible';
            if (ocupados.has(`${cancha.id}-${horaInicio}`)) {
                estado = 'ocupado';
            } else if (dayjs(`${fechaSeleccionadaStr}T${horaInicio}`).diff(ahora, 'hour', true) < HORAS_ANTICIPACION_MINIMA) {
                // Ya no es solo "¿ya pasó?": ahora también cubre "falta muy
                // poco para que empiece" (menos de HORAS_ANTICIPACION_MINIMA),
                // que es exactamente lo mismo que valida crearReserva. Al
                // sacar el "esHoy &&" de antes, esto también funciona bien
                // si alguna vez se corre muy cerca de la medianoche.
                estado = 'muyPronto';
            }
            return { horaInicio, estado };
        }),
    }));

    return {
        fechaSeleccionada: fechaSeleccionadaStr,
        fechaSeleccionadaFormateada,
        fechasDisponibles,
        canchas: canchasConHorarios,
        duraciones: DURACIONES_DISPONIBLES.map((minutos) => {
            // Antes esto mostraba "1:30 hrs", que no queda claro a simple
            // vista si son horas y minutos, o una hora rara ("la 1:30").
            // Se arma un texto explícito ("1 hora 30 minutos") para que no
            // haya dudas.
            const horas = Math.floor(minutos / 60);
            const minutosRestantes = minutos % 60;
            let etiqueta = `${horas} hora${horas !== 1 ? 's' : ''}`;
            if (minutosRestantes > 0) {
                etiqueta += ` ${minutosRestantes} minutos`;
            }
            return { minutos, etiqueta };
        }),
    };
}

/**
 * Página pública de Reservas: cualquier visitante puede ver qué horarios
 * están disponibles. Solo se le pide iniciar sesión al momento de reservar
 * (ver crearReservaControlador), no para mirar la disponibilidad.
 */
export const mostrarReservas = async (req, res, next) => {
    try {
        const datos = await construirDatosVista(req.query.fecha);
        res.render('reservas', {
            title: 'Reservas',
            ...datos,
            mensajeExito: req.query.exito ? 'Tu reserva fue creada con éxito.' : null,
            error: null,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Crea una reserva. Esta ruta SÍ exige sesión iniciada (ver routes/reservas.js).
 */
export const crearReservaControlador = async (req, res, next) => {
    const { canchaId, fecha, horaInicio, duracionMinutos } = req.body;

    const volverConError = async (mensajeError) => {
        const datos = await construirDatosVista(fecha);
        return res.status(400).render('reservas', {
            title: 'Reservas',
            ...datos,
            mensajeExito: null,
            error: mensajeError,
        });
    };

    try {
        if (!canchaId || !fecha || !horaInicio || !duracionMinutos) {
            return await volverConError('Faltan datos para crear la reserva.');
        }

        try {
            await crearReserva({
                usuarioId: req.session.usuario.id,
                canchaId: Number(canchaId),
                fecha,
                horaInicio,
                duracionMinutos: Number(duracionMinutos),
            });
        } catch (errorReserva) {
            // 'HORARIO_NO_DISPONIBLE' es el único mensaje "técnico" que lanza
            // el servicio (ver reservaService.js) — todos los demás ya vienen
            // en español, listos para mostrarse tal cual.
            const mensaje =
                errorReserva.message === 'HORARIO_NO_DISPONIBLE'
                    ? 'Ese horario ya no está disponible (alguien más lo reservó justo ahora, o se solapa con otra reserva). Elige otro horario o una duración más corta.'
                    : errorReserva.message;
            return await volverConError(mensaje);
        }

        registrarActividad(`🎾 RESERVA: ${req.session.usuario.email} reservó la cancha ${canchaId} el ${fecha} a las ${horaInicio}.`);

        // Redirige (en vez de renderizar directo) para que, si la persona
        // refresca la página después, el navegador no intente reenviar el
        // mismo formulario y crear la reserva dos veces.
        res.redirect(`/reservas?fecha=${fecha}&exito=1`);
    } catch (error) {
        next(error);
    }
};