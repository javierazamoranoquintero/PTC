import { Torneo } from '../models/index.js';
import { registrarActividad } from '../helpers/logger.js';

/**
 * Muestra el formulario para que el admin cargue un nuevo torneo.
 */
export const mostrarFormularioTorneo = async (req, res, next) => {
    try {
        const torneos = await Torneo.findAll({ order: [['fecha', 'ASC']] });
        res.render('admin/torneos/nuevo', {
            title: 'Nuevo torneo',
            torneos,
            error: null,
            valores: { nombre: '', fecha: '', detalle: '' },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Procesa el formulario: valida los datos y crea el torneo. La página
 * pública de Noticias lo va a mostrar en "Próximas Fechas" automáticamente
 * mientras su fecha no haya pasado — no hay que hacer nada más acá.
 */
export const crearTorneo = async (req, res, next) => {
    const { nombre, fecha, detalle } = req.body;

    const volverConError = async (mensajeError) => {
        const torneos = await Torneo.findAll({ order: [['fecha', 'ASC']] });
        return res.status(400).render('admin/torneos/nuevo', {
            title: 'Nuevo torneo',
            torneos,
            error: mensajeError,
            valores: { nombre, fecha, detalle },
        });
    };

    try {
        if (!nombre || !fecha) {
            return await volverConError('El nombre y la fecha son obligatorios.');
        }

        await Torneo.create({
            nombre,
            fecha,
            detalle: detalle || null,
            creadoPorId: req.session.usuario.id,
        });

        registrarActividad(`🎾 ADMIN: Torneo creado ("${nombre}", fecha ${fecha}).`);

        res.redirect('/admin/torneos/nuevo');
    } catch (error) {
        next(error);
    }
};