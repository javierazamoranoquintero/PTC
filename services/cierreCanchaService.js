// Servicio de "cierre de cancha".
//
// ¿Por qué esto no vive directo en el controlador? Porque tiene bastante
// lógica de negocio (encontrar reservas/clases afectadas, cancelarlas,
// liberar horarios, notificar) y ninguna de esas reglas depende de que la
// petición venga de un formulario HTTP. Separarlo en un "service" permite
// probar y reutilizar esta función sin tener que simular un req/res falso,
// y mantiene al controlador enfocado solo en "recibir la petición y
// mostrar una respuesta".
//
// Todo el proceso corre dentro de una transacción de base de datos: o se
// aplican TODOS los cambios (cancelar reservas, liberar bloques, avisar a
// las personas, crear el cierre), o no se aplica ninguno. Así evitamos
// dejar la base de datos a medio camino si algo falla en el medio.

import dayjs from 'dayjs';
import { Op } from 'sequelize';
import {
    sequelize,
    Reserva,
    Clase,
    InscripcionClase,
    BloqueOcupado,
    CierreCancha,
    Notificacion,
} from '../models/index.js';

// El club abre a las 07:00. El último bloque de 30 minutos posible
// EMPIEZA a las 22:00 (y termina a las 22:30) — esta regla ya estaba
// definida en el diseño de datos de la Fase 1, la reutilizamos tal cual.
const HORA_APERTURA = 7;
const HORA_ULTIMO_INICIO = 22;
const DURACION_BLOQUE_MINUTOS = 30;

/**
 * Genera todas las fecha/hora de inicio de bloque (07:00, 07:30, ..., 22:00)
 * del horario del club que caen dentro de un rango [inicioRango, finRango).
 * El rango puede cruzar varios días (por eso se recorre día por día).
 *
 * Devuelve un arreglo de objetos dayjs, cada uno representando el inicio
 * de un bloque de 30 minutos que hay que marcar como ocupado por el cierre.
 */
function generarBloquesDelClubEnRango(inicioRango, finRango) {
    const bloques = [];
    let diaCursor = inicioRango.startOf('day');
    const ultimoDia = finRango.startOf('day');

    while (!diaCursor.isAfter(ultimoDia)) {
        let bloqueCursor = diaCursor.hour(HORA_APERTURA).minute(0).second(0).millisecond(0);
        // 22:30 porque el ÚLTIMO bloque válido empieza a las 22:00 (HORA_ULTIMO_INICIO)
        // y dura 30 minutos: para incluirlo, el límite superior debe ser 22:30.
        const finDelDia = diaCursor.hour(HORA_ULTIMO_INICIO).minute(30).second(0).millisecond(0);

        while (bloqueCursor.isBefore(finDelDia)) {
            // El bloque se incluye si su INICIO cae dentro del rango del cierre.
            if (!bloqueCursor.isBefore(inicioRango) && bloqueCursor.isBefore(finRango)) {
                bloques.push(bloqueCursor);
            }
            bloqueCursor = bloqueCursor.add(DURACION_BLOQUE_MINUTOS, 'minute');
        }

        diaCursor = diaCursor.add(1, 'day');
    }

    return bloques;
}

/**
 * Arma el texto de la notificación para un socio o profesor afectado.
 * @param {'reserva'|'clase'} tipo
 */
function mensajeCancelacion(tipo, fecha, horaInicio, motivo) {
    const fechaFormateada = dayjs(fecha).format('DD-MM-YYYY');
    const horaFormateada = String(horaInicio).slice(0, 5); // "10:00:00" -> "10:00"
    return `Tu ${tipo} del ${fechaFormateada} a las ${horaFormateada} fue cancelada porque la cancha estará cerrada por: ${motivo}.`;
}

/**
 * Cierra UNA cancha durante un rango de fecha/hora. Hace, en orden:
 *
 *   1. Busca las reservas y clases de esa cancha que se solapan con el rango.
 *   2. Las cancela (estado 'cancelada_admin') y libera sus bloques ocupados.
 *   3. Notifica a cada socio afectado (y al profesor, si es una clase).
 *   4. Crea el registro de CierreCancha y ocupa esos horarios para que
 *      nadie pueda reservar encima mientras dure el cierre.
 *
 * @returns {Promise<{cierre: CierreCancha, reservasCanceladas: number, clasesCanceladas: number, notificacionesCreadas: number}>}
 */
export async function cerrarCancha({ canchaId, fechaHoraInicio, fechaHoraFin, motivo }) {
    const inicio = dayjs(fechaHoraInicio);
    const fin = dayjs(fechaHoraFin);

    if (!inicio.isValid() || !fin.isValid() || !fin.isAfter(inicio)) {
        throw new Error('El rango de fecha/hora del cierre no es válido.');
    }

    return sequelize.transaction(async (t) => {
        let notificacionesCreadas = 0;

        const crearNotificacion = async (usuarioId, tipo, fecha, horaInicio) => {
            await Notificacion.create(
                { usuarioId, mensaje: mensajeCancelacion(tipo, fecha, horaInicio, motivo) },
                { transaction: t }
            );
            notificacionesCreadas += 1;
        };

        // --- 1) Traer candidatas: mismo rango de DÍAS (filtro grueso en SQL) ---
        const rangoDeFechas = {
            [Op.between]: [inicio.format('YYYY-MM-DD'), fin.format('YYYY-MM-DD')],
        };

        const reservasCandidatas = await Reserva.findAll({
            where: { canchaId, estado: 'confirmada', fecha: rangoDeFechas },
            transaction: t,
        });

        const clasesCandidatas = await Clase.findAll({
            where: { canchaId, estado: 'programada', fecha: rangoDeFechas },
            transaction: t,
        });

        // Filtro fino en JavaScript: de las candidatas del mismo rango de días,
        // nos quedamos solo con las que de verdad se solapan en fecha Y hora
        // con el cierre (dos intervalos se solapan si uno empieza antes de
        // que el otro termine, Y termina después de que el otro empiece).
        const seSolapaConElCierre = (fecha, horaInicioItem, horaFinItem) => {
            const inicioItem = dayjs(`${fecha}T${horaInicioItem}`);
            const finItem = dayjs(`${fecha}T${horaFinItem}`);
            return inicioItem.isBefore(fin) && finItem.isAfter(inicio);
        };

        const reservasAfectadas = reservasCandidatas.filter((r) =>
            seSolapaConElCierre(r.fecha, r.horaInicio, r.horaFin)
        );
        const clasesAfectadas = clasesCandidatas.filter((c) =>
            seSolapaConElCierre(c.fecha, c.horaInicio, c.horaFin)
        );

        // --- 2) Cancelar reservas afectadas: estado + liberar bloque + avisar ---
        for (const reserva of reservasAfectadas) {
            await reserva.update({ estado: 'cancelada_admin' }, { transaction: t });

            // Se borran las filas de BloqueOcupado (no la reserva): la reserva
            // se conserva como historial con su nuevo estado, pero el horario
            // debe quedar libre... aunque en este caso vamos a "reocuparlo"
            // enseguida con el cierre (paso 4).
            await BloqueOcupado.destroy({ where: { reservaId: reserva.id }, transaction: t });

            await crearNotificacion(reserva.usuarioId, 'reserva', reserva.fecha, reserva.horaInicio);
        }

        // --- 3) Cancelar clases afectadas: estado + inscripciones + bloque + avisar ---
        for (const clase of clasesAfectadas) {
            await clase.update({ estado: 'cancelada_admin' }, { transaction: t });

            await BloqueOcupado.destroy({ where: { claseId: clase.id }, transaction: t });

            const inscripcionesActivas = await InscripcionClase.findAll({
                where: { claseId: clase.id, estado: 'inscrito' },
                transaction: t,
            });

            for (const inscripcion of inscripcionesActivas) {
                await inscripcion.update({ estado: 'cancelada_admin' }, { transaction: t });
                await crearNotificacion(inscripcion.usuarioId, 'clase', clase.fecha, clase.horaInicio);
            }

            // El profesor de la clase también debe enterarse.
            await crearNotificacion(clase.profesorId, 'clase', clase.fecha, clase.horaInicio);
        }

        // --- 4) Crear el cierre y ocupar sus bloques ---
        // Esto va DESPUÉS de liberar los bloques de las reservas/clases
        // canceladas: si lo hiciéramos antes, el bloque viejo (todavía sin
        // borrar) y el bloque nuevo del cierre chocarían contra la regla de
        // "un solo horario por cancha" (UNIQUE canchaId+fecha+horaInicio).
        const cierre = await CierreCancha.create(
            {
                canchaId,
                fechaHoraInicio: inicio.toDate(),
                fechaHoraFin: fin.toDate(),
                motivo,
            },
            { transaction: t }
        );

        const bloquesDelCierre = generarBloquesDelClubEnRango(inicio, fin);

        for (const bloque of bloquesDelCierre) {
            await BloqueOcupado.create(
                {
                    canchaId,
                    fecha: bloque.format('YYYY-MM-DD'),
                    horaInicio: bloque.format('HH:mm:ss'),
                    cierreCanchaId: cierre.id,
                },
                { transaction: t }
            );
        }

        return {
            cierre,
            reservasCanceladas: reservasAfectadas.length,
            clasesCanceladas: clasesAfectadas.length,
            notificacionesCreadas,
        };
    });
}