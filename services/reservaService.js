// Servicio de "reserva de cancha" (juego libre, hecha por un socio).
//
// Igual que cierreCanchaService.js, esta lógica no vive en el controlador
// porque tiene reglas de negocio importantes (validar horarios, evitar el
// doble arriendo) que no dependen de que la petición venga de un
// formulario HTTP. Separarlo así también permite reutilizar las mismas
// funciones (por ejemplo generarHorariosDeInicio) desde el controlador,
// para armar la grilla de horarios que ve el socio.

import dayjs from 'dayjs';
import { sequelize, Reserva, BloqueOcupado, Cancha, Notificacion } from '../models/index.js';

// Mismas reglas de horario ya definidas en el diseño de datos del club
// (ver también cierreCanchaService.js, que usa las mismas constantes).
const HORA_APERTURA = 7;
const HORA_ULTIMO_INICIO = 22;
const DURACION_BLOQUE_MINUTOS = 30;
const MAX_DIAS_ANTICIPACION = 14;

// Antes solo se exigía que el horario no hubiera pasado ya (podías reservar
// literalmente "ahora mismo"). Javiera pidió un colchón más realista: hay
// que reservar con al menos este número de horas de anticipación, para que
// el club tenga tiempo de prepararse. Se exporta porque reservaController.js
// necesita el mismo número para pintar la grilla de horarios igual de gris.
const HORAS_ANTICIPACION_MINIMA = 2;
export { HORAS_ANTICIPACION_MINIMA };

// Duraciones que se ofrecen al socio en el formulario. La reserva libre más
// corta permitida es 1:30 (3 bloques de 30 min); no hay un máximo definido
// en las reglas del club, pero se ofrece un tope razonable de 4:00 para que
// el menú desplegable no quede interminable.
export const DURACIONES_DISPONIBLES = [90, 120, 150, 180, 210, 240];

export { MAX_DIAS_ANTICIPACION };

/**
 * Arma la lista de horarios de inicio posibles en un día: 07:00, 07:30, ...,
 * hasta 22:00 (el último bloque empieza a las 22:00 y termina a las 22:30).
 */
export function generarHorariosDeInicio() {
    const horarios = [];
    let cursor = dayjs().hour(HORA_APERTURA).minute(0).second(0);
    const ultimo = dayjs().hour(HORA_ULTIMO_INICIO).minute(0).second(0);

    while (!cursor.isAfter(ultimo)) {
        horarios.push(cursor.format('HH:mm'));
        cursor = cursor.add(DURACION_BLOQUE_MINUTOS, 'minute');
    }

    return horarios;
}

// Arma la lista de horas de inicio de cada bloque de 30 minutos que ocupa
// una reserva, a partir de su hora de inicio y su duración total.
// Ej: ('10:00', 90) -> ['10:00', '10:30', '11:00'] (3 bloques = 1:30).
function generarBloquesDesde(horaInicio, duracionMinutos) {
    const bloques = [];
    let cursor = dayjs(`2000-01-01T${horaInicio}`);
    const cantidadBloques = duracionMinutos / DURACION_BLOQUE_MINUTOS;

    for (let i = 0; i < cantidadBloques; i++) {
        bloques.push(cursor.format('HH:mm'));
        cursor = cursor.add(DURACION_BLOQUE_MINUTOS, 'minute');
    }

    return bloques;
}

/**
 * Crea una reserva de juego libre para un socio, validando todas las reglas
 * del club. Lanza un Error con un mensaje en español (listo para mostrar)
 * si algo no es válido; lanza un Error con el mensaje especial
 * 'HORARIO_NO_DISPONIBLE' si el horario elegido ya está ocupado (por otra
 * reserva, una clase, o un cierre de cancha).
 *
 * @returns {Promise<Reserva>} la reserva recién creada.
 */
export async function crearReserva({ usuarioId, canchaId, fecha, horaInicio, duracionMinutos }) {
    const fechaDayjs = dayjs(fecha, 'YYYY-MM-DD', true);
    if (!fechaDayjs.isValid()) {
        throw new Error('La fecha no es válida.');
    }

    const hoy = dayjs().startOf('day');
    if (fechaDayjs.isBefore(hoy)) {
        throw new Error('No puedes reservar una fecha que ya pasó.');
    }
    if (fechaDayjs.isAfter(hoy.add(MAX_DIAS_ANTICIPACION, 'day'))) {
        throw new Error(`Solo puedes reservar hasta ${MAX_DIAS_ANTICIPACION} días por adelantado.`);
    }

    if (!DURACIONES_DISPONIBLES.includes(duracionMinutos)) {
        throw new Error('La duración elegida no es válida.');
    }

    const horariosValidos = generarHorariosDeInicio();
    if (!horariosValidos.includes(horaInicio)) {
        throw new Error('El horario de inicio no es válido.');
    }

    const inicio = dayjs(`2000-01-01T${horaInicio}`);
    const fin = inicio.add(duracionMinutos, 'minute');
    const cierreDelClub = dayjs('2000-01-01T22:30');
    if (fin.isAfter(cierreDelClub)) {
        throw new Error('Esa duración se pasa del horario de cierre del club (el último bloque empieza a las 22:00).');
    }

    // No basta con que el horario no haya pasado: tiene que faltar al menos
    // HORAS_ANTICIPACION_MINIMA para que empiece. "diff(..., 'hour', true)"
    // calcula la diferencia en horas como número decimal (ej: 1.5), así que
    // la comparación funciona aunque falten minutos sueltos, no solo horas
    // enteras. Esto reemplaza al chequeo viejo de "¿ya pasó?", que era menos
    // estricto (dejaba reservar hasta un segundo antes de que empezara).
    const inicioReal = dayjs(`${fecha}T${horaInicio}`);
    if (inicioReal.diff(dayjs(), 'hour', true) < HORAS_ANTICIPACION_MINIMA) {
        throw new Error(`Debes reservar con al menos ${HORAS_ANTICIPACION_MINIMA} horas de anticipación.`);
    }

    const cancha = await Cancha.findByPk(canchaId);
    if (!cancha) {
        throw new Error('La cancha seleccionada no existe.');
    }

    const bloquesNecesarios = generarBloquesDesde(horaInicio, duracionMinutos);

    return sequelize.transaction(async (t) => {
        try {
            // Se revisa DENTRO de la transacción para achicar al máximo la
            // ventana en la que otra persona podría alcanzar a reservar el
            // mismo horario justo en el medio.
            const bloquesOcupadosExistentes = await BloqueOcupado.findAll({
                where: {
                    canchaId,
                    fecha,
                    horaInicio: bloquesNecesarios.map((hora) => `${hora}:00`),
                },
                transaction: t,
            });

            if (bloquesOcupadosExistentes.length > 0) {
                throw new Error('HORARIO_NO_DISPONIBLE');
            }

            const reserva = await Reserva.create(
                {
                    usuarioId,
                    canchaId,
                    fecha,
                    horaInicio: `${horaInicio}:00`,
                    horaFin: `${fin.format('HH:mm')}:00`,
                    estado: 'confirmada',
                },
                { transaction: t }
            );

            for (const horaBloque of bloquesNecesarios) {
                await BloqueOcupado.create(
                    { canchaId, fecha, horaInicio: `${horaBloque}:00`, reservaId: reserva.id },
                    { transaction: t }
                );
            }

            return reserva;
        } catch (error) {
            // Si dos personas alcanzan a pasar la revisión de arriba casi al
            // mismo tiempo (carrera real), es la restricción UNIQUE de la
            // base de datos la que realmente evita el choque — acá solo
            // traducimos ese error técnico al mismo mensaje conocido.
            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new Error('HORARIO_NO_DISPONIBLE');
            }
            throw error;
        }
    });
}

/**
 * Cancela una reserva de juego libre hecha por un socio (no una cancelación
 * de admin, esa la maneja cierreCanchaService). Regla del club: solo se
 * puede cancelar hasta 24 horas antes de la hora de inicio.
 *
 * Lanza un Error con un mensaje en español (listo para mostrar) si algo no
 * es válido: la reserva no existe, no es del socio que la pide cancelar, ya
 * no está activa, o ya pasó el plazo de 24 horas.
 *
 * @returns {Promise<Reserva>} la reserva ya cancelada.
 */
export async function cancelarReserva({ reservaId, usuarioId }) {
    const reserva = await Reserva.findByPk(reservaId);

    if (!reserva) {
        throw new Error('Esa reserva no existe.');
    }
    if (reserva.usuarioId !== usuarioId) {
        throw new Error('No puedes cancelar una reserva que no es tuya.');
    }
    if (reserva.estado !== 'confirmada') {
        throw new Error('Esta reserva ya no está activa.');
    }

    const inicioReserva = dayjs(`${reserva.fecha}T${reserva.horaInicio}`);
    if (inicioReserva.diff(dayjs(), 'hour', true) < 24) {
        throw new Error('Solo puedes cancelar una reserva hasta 24 horas antes de su horario.');
    }

    return sequelize.transaction(async (t) => {
        await reserva.update({ estado: 'cancelada_socio' }, { transaction: t });
        // Se borran los bloques ocupados (no la reserva, que se conserva como
        // historial con su nuevo estado) para que ese horario quede libre y
        // otro socio pueda reservarlo — mismo patrón que cierreCanchaService.
        await BloqueOcupado.destroy({ where: { reservaId: reserva.id }, transaction: t });
        return reserva;
    });
}

/**
 * Cancela una reserva ADMINISTRATIVAMENTE (el club cancela, no el socio).
 * A diferencia de cancelarReserva (arriba), acá:
 *
 *   - No exige que quien cancela sea el dueño de la reserva.
 *   - No aplica la regla de 24 horas de anticipación.
 *   - Queda con estado 'cancelada_admin' (no 'cancelada_socio'), y se le
 *     avisa al socio con una Notificación in-app — mismo patrón que ya
 *     usa cierreCanchaService.js cuando cancela reservas por un cierre
 *     de cancha.
 */
export async function cancelarReservaComoAdmin({ reservaId }) {
    const reserva = await Reserva.findByPk(reservaId);

    if (!reserva) {
        throw new Error('Esa reserva no existe.');
    }
    if (reserva.estado !== 'confirmada') {
        throw new Error('Esta reserva ya no está activa.');
    }

    return sequelize.transaction(async (t) => {
        await reserva.update({ estado: 'cancelada_admin' }, { transaction: t });
        await BloqueOcupado.destroy({ where: { reservaId: reserva.id }, transaction: t });

        const fechaFormateada = dayjs(reserva.fecha).format('DD-MM-YYYY');
        const horaFormateada = String(reserva.horaInicio).slice(0, 5); // "10:00:00" -> "10:00"
        await Notificacion.create(
            {
                usuarioId: reserva.usuarioId,
                mensaje: `Tu reserva del ${fechaFormateada} a las ${horaFormateada} fue cancelada por el club.`,
            },
            { transaction: t }
        );

        return reserva;
    });
}