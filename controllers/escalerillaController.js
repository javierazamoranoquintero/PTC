import { EscalerillaPosicion, Usuario } from '../models/index.js';

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