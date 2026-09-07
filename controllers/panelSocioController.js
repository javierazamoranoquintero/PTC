import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import 'dayjs/locale/es.js';
import { Op } from 'sequelize';
import { Usuario, EscalerillaPosicion, Reserva, Cancha, Torneo } from '../models/index.js';
import { registrarActividad } from '../helpers/logger.js';
import { subidaFoto } from '../middlewares/subidaFoto.js';
// El clima real (Open-Meteo) ahora vive en un helper compartido, porque
// tanto Inicio como Panel del Socio lo necesitan — así evitamos tener la
// misma función copiada y pegada en dos controladores distintos.
import { obtenerClimaPichilemu } from '../helpers/clima.js';
import { cancelarReserva } from '../services/reservaService.js';

const MAX_PROXIMAS_RESERVAS = 5;
const MAX_PROXIMOS_TORNEOS = 3;

export const mostrarPanelSocio = async (req, res, next) => {
    try {
        const usuarioId = req.session.usuario.id;

        // Se busca el usuario fresco en la base de datos (no solo lo que
        // guarda la sesión) para reflejar de inmediato cualquier cambio
        // hecho en "Editar Perfil", sin tener que volver a loguearse.
        const usuario = await Usuario.findByPk(usuarioId);

        const posicion = await EscalerillaPosicion.findOne({ where: { usuarioId } });

        const hoy = dayjs().format('YYYY-MM-DD');

        const reservasEncontradas = await Reserva.findAll({
            where: { usuarioId, estado: 'confirmada', fecha: { [Op.gte]: hoy } },
            include: [{ model: Cancha, attributes: ['nombre', 'tipo'] }],
            order: [
                ['fecha', 'ASC'],
                ['horaInicio', 'ASC'],
            ],
            limit: MAX_PROXIMAS_RESERVAS,
        });

        // Igual que con los torneos: se arma acá el mes/día ya formateados
        // en español, y se recorta la hora ("HH:MM:SS" -> "HH:MM") — la
        // vista solo pinta, no calcula fechas.
        // "puedeCancelar" se calcula acá (no en la vista) siguiendo la misma
        // regla del club que ya valida reservaService.cancelarReserva: solo
        // se puede cancelar hasta 24 horas antes del horario de inicio.
        const reservas = reservasEncontradas.map((reserva) => {
            const inicioReserva = dayjs(`${reserva.fecha}T${reserva.horaInicio}`);
            return {
                id: reserva.id,
                mesCorto: dayjs(reserva.fecha).locale('es').format('MMM').toUpperCase(),
                dia: dayjs(reserva.fecha).format('DD'),
                horaInicio: reserva.horaInicio.slice(0, 5),
                horaFin: reserva.horaFin.slice(0, 5),
                cancha: reserva.Cancha ? reserva.Cancha.nombre : 'Cancha',
                puedeCancelar: inicioReserva.diff(dayjs(), 'hour', true) >= 24,
            };
        });

        const torneosEncontrados = await Torneo.findAll({
            where: { fecha: { [Op.gte]: hoy } },
            order: [['fecha', 'ASC']],
            limit: MAX_PROXIMOS_TORNEOS,
        });

        // Igual que en /noticias: el mes/día ya formateados en español se
        // arman acá, no en la vista — la vista solo pinta.
        const proximosTorneos = torneosEncontrados.map((torneo) => ({
            id: torneo.id,
            nombre: torneo.nombre,
            detalle: torneo.detalle,
            mesCorto: dayjs(torneo.fecha).locale('es').format('MMM').toUpperCase(),
            dia: dayjs(torneo.fecha).format('DD'),
        }));

        // "Estado del Club" ahora es una tarjeta puramente de clima (antes
        // también mostraba canchas del club y reservas de hoy, que no tenían
        // relación con el clima y se sacaron por pedido de Javiera).
        const clima = await obtenerClimaPichilemu();

        res.render('panel-socio', {
            title: 'Panel del Socio',
            usuario,
            posicionEscalerilla: posicion ? posicion.posicion : null,
            reservas,
            proximosTorneos,
            clima,
            socioDesde: dayjs(usuario.createdAt).locale('es').format('D [de] MMMM [de] YYYY'),
            // Mensajes de resultado tras cancelar una reserva (ver
            // cancelarReservaControlador, más abajo, que redirige acá con
            // estos parámetros en vez de renderizar directo).
            mensajeReserva: req.query.reservaCancelada ? 'Tu reserva fue cancelada.' : null,
            errorReserva: req.query.errorReserva || null,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Cancela una reserva del socio logueado. Toda la validación (que sea suya,
 * que siga confirmada, que falten más de 24 horas) vive en el servicio; acá
 * solo se traduce el resultado a una redirección con un mensaje.
 */
export const cancelarReservaControlador = async (req, res, next) => {
    try {
        await cancelarReserva({
            reservaId: Number(req.params.id),
            usuarioId: req.session.usuario.id,
        });

        registrarActividad(`🎾❌ RESERVA: ${req.session.usuario.email} canceló su reserva #${req.params.id}.`);

        res.redirect('/panel-socio?reservaCancelada=1');
    } catch (error) {
        // Los mensajes que lanza cancelarReserva ya vienen en español y
        // listos para mostrarse (ver reservaService.js).
        res.redirect(`/panel-socio?errorReserva=${encodeURIComponent(error.message)}`);
    }
};

// --- EDITAR PERFIL ---

export const mostrarEditarPerfil = async (req, res, next) => {
    try {
        const usuario = await Usuario.findByPk(req.session.usuario.id);

        res.render('panel-socio/editar-perfil', {
            title: 'Editar perfil',
            error: null,
            valores: {
                nombre: usuario.nombre,
                marcaRaqueta: usuario.marcaRaqueta || '',
                edad: usuario.edad || '',
                sexo: usuario.sexo || '',
                juegaTenis: usuario.juegaTenis,
                juegaPadel: usuario.juegaPadel,
            },
            fotoActual: usuario.fotoUrl,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Mismo motivo que manejarSubidaFotoRegistro (ver autenticacionController.js):
 * Multer entrega sus propios errores por callback, así que se maneja acá
 * mismo para poder mostrar de nuevo el formulario con un mensaje claro.
 */
export const manejarSubidaFotoPerfil = (req, res, next) => {
    subidaFoto.single('foto')(req, res, async (error) => {
        if (!error) {
            return next();
        }

        try {
            const usuarioActual = await Usuario.findByPk(req.session.usuario.id);
            res.render('panel-socio/editar-perfil', {
                title: 'Editar perfil',
                error:
                    error.message === 'TIPO_NO_PERMITIDO'
                        ? 'La foto debe ser JPG, PNG o WEBP.'
                        : 'La foto no se pudo subir (¿es muy pesada? el máximo es 2MB).',
                valores: {
                    nombre: req.body.nombre || '',
                    marcaRaqueta: req.body.marcaRaqueta || '',
                    edad: req.body.edad || '',
                    sexo: req.body.sexo || '',
                    juegaTenis: !!req.body.juegaTenis,
                    juegaPadel: !!req.body.juegaPadel,
                },
                fotoActual: usuarioActual.fotoUrl,
            });
        } catch (errorInterno) {
            next(errorInterno);
        }
    });
};

export const actualizarPerfil = async (req, res, next) => {
    const usuarioId = req.session.usuario.id;
    const { nombre, marcaRaqueta, edad, sexo } = req.body;
    const juegaTenis = !!req.body.juegaTenis;
    const juegaPadel = !!req.body.juegaPadel;

    const valores = { nombre, marcaRaqueta, edad, sexo, juegaTenis, juegaPadel };

    const volverConError = async (mensajeError) => {
        // Si ya se alcanzó a subir una foto nueva pero el resto del
        // formulario falla, se borra ese archivo para no dejarlo huérfano.
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
        const usuarioActual = await Usuario.findByPk(usuarioId);
        return res.status(400).render('panel-socio/editar-perfil', {
            title: 'Editar perfil',
            error: mensajeError,
            valores,
            fotoActual: usuarioActual.fotoUrl,
        });
    };

    try {
        if (!nombre || !marcaRaqueta || !edad || !sexo) {
            return await volverConError('Todos los campos son obligatorios.');
        }

        if (!juegaTenis && !juegaPadel) {
            return await volverConError('Indica si juegas tenis, pádel, o ambos.');
        }

        const edadNumero = parseInt(edad, 10);
        if (Number.isNaN(edadNumero) || edadNumero < 3 || edadNumero > 100) {
            return await volverConError('Ingresa una edad válida (entre 3 y 100 años).');
        }

        const usuario = await Usuario.findByPk(usuarioId);

        const datosActualizados = {
            nombre,
            marcaRaqueta,
            edad: edadNumero,
            sexo,
            juegaTenis,
            juegaPadel,
        };

        // Si subió una foto nueva, reemplaza la anterior — y borra el
        // archivo viejo del disco, para no ir acumulando fotos que ya
        // nadie usa.
        if (req.file) {
            if (usuario.fotoUrl) {
                const rutaFotoVieja = path.join(import.meta.dirname, '..', 'public', usuario.fotoUrl);
                fs.unlink(rutaFotoVieja, () => {});
            }
            datosActualizados.fotoUrl = `/uploads/perfiles/${req.file.filename}`;
        }

        await usuario.update(datosActualizados);

        // La sesión también guarda el nombre (se muestra en el navbar): si
        // no la actualizamos acá, el navbar seguiría mostrando el nombre
        // viejo hasta el próximo login.
        req.session.usuario.nombre = usuario.nombre;

        registrarActividad(`✏️ PERFIL: ${usuario.email} actualizó su perfil.`);

        res.redirect('/panel-socio');
    } catch (error) {
        next(error);
    }
};