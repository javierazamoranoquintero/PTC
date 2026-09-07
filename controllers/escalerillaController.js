import { Op } from 'sequelize';
import { EscalerillaPosicion, Usuario } from '../models/index.js';
import { registrarActividad } from '../helpers/logger.js';

const TAMANO_TRAMO = 10;

/**
 * Agrupa la lista de jugadores (ya ordenada por posición) en bloques de 10:
 * 1-10, 11-20, 21-30, etc. La cantidad de bloques se calcula sola según la
 * posición más alta que exista — no está hardcodeada.
 */
function armarTramos(jugadores) {
    if (jugadores.length === 0) {
        return [];
    }

    const maxPosicion = Math.max(...jugadores.map((j) => j.posicion));
    const cantidadTramos = Math.ceil(maxPosicion / TAMANO_TRAMO);

    const tramos = [];
    for (let i = 0; i < cantidadTramos; i++) {
        const inicio = i * TAMANO_TRAMO + 1;
        const fin = inicio + TAMANO_TRAMO - 1;
        const jugadoresDelTramo = jugadores.filter((j) => j.posicion >= inicio && j.posicion <= fin);
        tramos.push({
            etiqueta: `${inicio}-${fin}`,
            inicio,
            fin,
            jugadores: jugadoresDelTramo,
            // El destacado es el de menor posición DENTRO del tramo, no
            // necesariamente el número redondo (ej. si el admin borró al #11,
            // el destacado del segundo tramo pasa a ser el #12).
            destacado: jugadoresDelTramo.length > 0 ? jugadoresDelTramo[0] : null,
        });
    }

    return tramos;
}

export const mostrarEscalerilla = async (req, res, next) => {
    try {
        const posiciones = await EscalerillaPosicion.findAll({
            include: [{ model: Usuario, attributes: ['id', 'nombre', 'marcaRaqueta'] }],
            order: [['posicion', 'ASC']],
        });

        const jugadores = posiciones.map((p) => ({
            posicion: p.posicion,
            usuarioId: p.Usuario.id,
            nombre: p.Usuario.nombre,
            marcaRaqueta: p.Usuario.marcaRaqueta,
        }));

        res.render('escalerilla', {
            title: 'Escalerilla',
            nombreClub: 'PTC - Pichilemu Tennis Club',
            tramos: armarTramos(jugadores),
            totalJugadores: jugadores.length,
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// ADMIN: gestión manual de la Escalerilla
// ============================================================
//
// Recordatorio de la regla de negocio (ver claude/diseno-datos-fase1.md):
// la escalerilla es única y general para todo el club, y el admin la
// actualiza 100% A MANO — sin ningún cálculo automático por resultados de
// partidos. Estas funciones son justamente eso: agregar un socio a la
// lista, cambiarle la posición, o sacarlo.

/**
 * Muestra el ranking completo (igual que la vista pública) más un
 * formulario para agregar un socio nuevo, y controles para editar la
 * posición o quitar a cada jugador ya cargado.
 */
export const mostrarEscalerillaAdmin = async (req, res, next) => {
    try {
        const posiciones = await EscalerillaPosicion.findAll({
            include: [{ model: Usuario, attributes: ['id', 'nombre', 'marcaRaqueta'] }],
            order: [['posicion', 'ASC']],
        });

        const jugadores = posiciones.map((p) => ({
            usuarioId: p.Usuario.id,
            nombre: p.Usuario.nombre,
            marcaRaqueta: p.Usuario.marcaRaqueta,
            posicion: p.posicion,
        }));

        // Solo se puede "agregar a la escalerilla" a un socio que todavía no
        // esté en ella (cada usuario tiene, como máximo, una posición —
        // ver la asociación hasOne en models/index.js). Por eso se excluyen
        // acá los que ya tienen una.
        const idsEnEscalerilla = jugadores.map((j) => j.usuarioId);
        const usuariosDisponibles = await Usuario.findAll({
            where: { id: { [Op.notIn]: idsEnEscalerilla.length > 0 ? idsEnEscalerilla : [0] } },
            attributes: ['id', 'nombre'],
            order: [['nombre', 'ASC']],
        });

        res.render('admin/escalerilla', {
            title: 'Escalerilla',
            nombreClub: 'PTC - Pichilemu Tennis Club',
            paginaActual: 'escalerilla',
            jugadores,
            usuariosDisponibles,
            error: req.query.error || null,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Agrega un socio a la escalerilla, en la posición que indique el admin.
 * Como "posicion" es UNIQUE en la base de datos, si ya existe alguien en
 * esa posición, Sequelize lanza un SequelizeUniqueConstraintError — lo
 * capturamos para mostrar un mensaje claro en vez del error genérico.
 */
export const agregarJugadorEscalerilla = async (req, res, next) => {
    const { usuarioId, posicion } = req.body;

    try {
        if (!usuarioId || !posicion) {
            return res.redirect(`/admin/escalerilla?error=${encodeURIComponent('Debes elegir un socio y una posición.')}`);
        }

        await EscalerillaPosicion.create({ usuarioId, posicion: parseInt(posicion, 10) });

        registrarActividad(`🏆 ADMIN: Jugador #${usuarioId} agregado a la escalerilla (posición ${posicion}).`);

        res.redirect('/admin/escalerilla');
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.redirect(`/admin/escalerilla?error=${encodeURIComponent('Ya existe un jugador en esa posición.')}`);
        }
        next(error);
    }
};

/**
 * Cambia la posición de un socio que YA está en la escalerilla.
 */
export const actualizarPosicionEscalerilla = async (req, res, next) => {
    const { usuarioId } = req.params;
    const { posicion } = req.body;

    try {
        const registro = await EscalerillaPosicion.findOne({ where: { usuarioId } });
        if (!registro) {
            return res.redirect(`/admin/escalerilla?error=${encodeURIComponent('Ese jugador no está en la escalerilla.')}`);
        }

        await registro.update({ posicion: parseInt(posicion, 10) });

        registrarActividad(`🏆 ADMIN: Posición de escalerilla actualizada (usuario #${usuarioId} → ${posicion}).`);

        res.redirect('/admin/escalerilla');
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.redirect(`/admin/escalerilla?error=${encodeURIComponent('Ya existe un jugador en esa posición.')}`);
        }
        next(error);
    }
};

/**
 * Saca a un socio de la escalerilla por completo (deja de aparecer en el
 * ranking, hasta que se lo vuelva a agregar).
 */
export const quitarJugadorEscalerilla = async (req, res, next) => {
    try {
        await EscalerillaPosicion.destroy({ where: { usuarioId: req.params.usuarioId } });

        registrarActividad(`🏆 ADMIN: Jugador #${req.params.usuarioId} sacado de la escalerilla.`);

        res.redirect('/admin/escalerilla');
    } catch (error) {
        next(error);
    }
};