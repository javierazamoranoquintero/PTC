import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import 'dayjs/locale/es.js';
import { Op } from 'sequelize';
import { Noticia, Torneo } from '../models/index.js';
import { registrarActividad } from '../helpers/logger.js';
import { subidaFotoNoticia } from '../middlewares/subidaFoto.js';

// Galería de videos: todavía no existe infraestructura real para videos
// (no hay campo de URL ni panel de administración para cargarlos), así que
// por ahora se deja como contenido de ejemplo, igual que las fotos
// placeholder de otras páginas. Cuando exista un origen real, esto se
// reemplaza por una consulta a la base de datos.
const VIDEOS_EJEMPLO = [
    {
        titulo: 'Resumen Final Open Pichilemu 2024',
        detalle: '10 mins • Mejores jugadas',
        imagen: '/images/video-1.jpg',
    },
    {
        titulo: 'Clínica de Saque con Head Coach',
        detalle: '15 mins • Tutorial',
        imagen: '/images/video-2.jpg',
    },
    {
        titulo: 'Recorrido por Nuevas Instalaciones',
        detalle: '5 mins • Club',
        imagen: '/images/video-3.jpg',
    },
];

// Cuántos torneos futuros mostrar como máximo en "Próximas Fechas" (si hay
// más cargados, el resto simplemente no se muestra en esta vista).
const MAX_PROXIMOS_TORNEOS = 4;

export const mostrarNoticias = async (req, res, next) => {
    try {
        const noticias = await Noticia.findAll({ order: [['createdAt', 'DESC']] });

        // El "Torneo Destacado" es la noticia más reciente marcada con la
        // categoría especial 'Torneo' (el resultado del último torneo
        // jugado). El resto de las noticias (sin importar su categoría)
        // se muestran abajo, en "Artículos y Novedades".
        const torneoDestacado = noticias.find((noticia) => noticia.categoria === 'Torneo') || null;
        const articulos = noticias.filter((noticia) => noticia !== torneoDestacado);

        const hoy = dayjs().format('YYYY-MM-DD');
        const torneosEncontrados = await Torneo.findAll({
            where: { fecha: { [Op.gte]: hoy } },
            order: [['fecha', 'ASC']],
            limit: MAX_PROXIMOS_TORNEOS,
        });

        // Se arma el mes/día ya formateados en español acá (y no en la vista)
        // para no repetir lógica de fechas en el .ejs — la vista solo pinta.
        const proximosTorneos = torneosEncontrados.map((torneo) => ({
            id: torneo.id,
            nombre: torneo.nombre,
            detalle: torneo.detalle,
            mesCorto: dayjs(torneo.fecha).locale('es').format('MMM').toUpperCase(),
            dia: dayjs(torneo.fecha).format('DD'),
        }));

        res.render('noticias', {
            title: 'Noticias',
            nombreClub: 'PTC - Pichilemu Tennis Club',
            torneoDestacado,
            articulos,
            proximosTorneos,
            videos: VIDEOS_EJEMPLO,
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// ADMIN: CRUD de Noticias (crear, editar, eliminar)
// ============================================================
//
// La página pública (mostrarNoticias, arriba) solo LEE noticias. Todo lo
// de acá para abajo es exclusivo del panel de administración: son las
// pantallas donde el admin realmente escribe/edita/borra una noticia.
// Reutilizan la MISMA vista (views/admin/noticias/nuevo.ejs) tanto para
// crear como para editar — mismo patrón visual que "Nuevo torneo", pero
// con un flag "modoEdicion" para que la vista sepa a qué URL enviar el
// formulario y qué botón mostrar.

// Valores de formulario "en blanco", para cuando se muestra el formulario
// de CREAR (sin ninguna noticia todavía cargada en los campos).
const VALORES_NOTICIA_VACIOS = { titulo: '', categoria: '', contenido: '' };

/**
 * Trae la lista de noticias para mostrar al lado del formulario (más
 * recientes primero) — igual que hace torneoController con los torneos.
 */
async function obtenerNoticiasParaAdmin() {
    return Noticia.findAll({ order: [['createdAt', 'DESC']] });
}

/**
 * Muestra el formulario para CREAR una noticia nueva, con la lista de
 * noticias ya cargadas al lado (mismo patrón que "Nuevo torneo").
 */
export const mostrarFormularioNoticias = async (req, res, next) => {
    try {
        const noticias = await obtenerNoticiasParaAdmin();
        res.render('admin/noticias/nuevo', {
            title: 'Noticias',
            noticias,
            error: null,
            modoEdicion: false,
            noticiaId: null,
            imagenActual: null,
            valores: VALORES_NOTICIA_VACIOS,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Muestra la MISMA vista del formulario, pero precargada con los datos de
 * una noticia existente para editarla (solo cambia a qué URL se envía el
 * formulario y con qué datos arranca).
 */
export const mostrarFormularioEditarNoticia = async (req, res, next) => {
    try {
        const noticia = await Noticia.findByPk(req.params.id);
        if (!noticia) {
            return res.status(404).render('error', { message: 'Noticia no encontrada.', error: {} });
        }

        const noticias = await obtenerNoticiasParaAdmin();
        res.render('admin/noticias/nuevo', {
            title: 'Editar noticia',
            noticias,
            error: null,
            modoEdicion: true,
            noticiaId: noticia.id,
            imagenActual: noticia.imagenUrl,
            valores: {
                titulo: noticia.titulo,
                categoria: noticia.categoria || '',
                contenido: noticia.contenido,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Multer necesita "envolver" la ruta de forma distinta al resto de los
 * middlewares del proyecto: si algo sale mal (imagen muy pesada, o de un
 * tipo no permitido), Multer llama a su callback CON un error en vez de
 * pasarlo a next(error) como hacen nuestros try/catch. Mismo patrón que
 * manejarSubidaFotoRegistro en autenticacionController.js. Sirve tanto
 * para crear como para editar (si req.params.id existe, es que estamos
 * editando).
 */
export const manejarSubidaImagenNoticia = (req, res, next) => {
    subidaFotoNoticia.single('imagen')(req, res, async (error) => {
        if (!error) {
            return next();
        }

        try {
            const noticias = await obtenerNoticiasParaAdmin();
            const editando = Boolean(req.params.id);
            res.status(400).render('admin/noticias/nuevo', {
                title: editando ? 'Editar noticia' : 'Noticias',
                noticias,
                modoEdicion: editando,
                noticiaId: req.params.id || null,
                imagenActual: null,
                error:
                    error.message === 'TIPO_NO_PERMITIDO'
                        ? 'La imagen debe ser JPG, PNG o WEBP.'
                        : 'La imagen no se pudo subir (¿es muy pesada? el máximo es 2MB).',
                valores: {
                    titulo: req.body.titulo || '',
                    categoria: req.body.categoria || '',
                    contenido: req.body.contenido || '',
                },
            });
        } catch (dbError) {
            next(dbError);
        }
    });
};

/**
 * Crea una noticia nueva. La imagen es OPCIONAL (el modelo ya lo permitía):
 * si no se sube ninguna, la vista pública ya sabe mostrar una imagen de
 * relleno (ver el "||" en views/noticias.ejs).
 */
export const crearNoticia = async (req, res, next) => {
    const { titulo, categoria, contenido } = req.body;

    const volverConError = async (mensajeError) => {
        // Si ya se alcanzó a guardar una imagen en disco (Multer la guarda
        // ANTES de que este controlador se ejecute) pero la creación falla
        // por otra razón, hay que borrarla. Si no, queda una imagen
        // "huérfana" en el servidor de una noticia que nunca se creó.
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
        const noticias = await obtenerNoticiasParaAdmin();
        return res.status(400).render('admin/noticias/nuevo', {
            title: 'Noticias',
            noticias,
            error: mensajeError,
            modoEdicion: false,
            noticiaId: null,
            imagenActual: null,
            valores: { titulo, categoria, contenido },
        });
    };

    try {
        if (!titulo || !contenido) {
            return await volverConError('El título y el contenido son obligatorios.');
        }

        await Noticia.create({
            titulo,
            categoria: categoria || null,
            contenido,
            imagenUrl: req.file ? `/uploads/noticias/${req.file.filename}` : null,
            autorId: req.session.usuario.id,
        });

        registrarActividad(`📰 ADMIN: Noticia creada ("${titulo}").`);

        res.redirect('/admin/noticias');
    } catch (error) {
        next(error);
    }
};

/**
 * Actualiza una noticia existente. Si se sube una imagen nueva, se borra
 * la anterior del disco (mismo patrón que panelSocioController usa para la
 * foto de perfil), para no ir acumulando archivos que ya nadie usa.
 */
export const actualizarNoticia = async (req, res, next) => {
    const { titulo, categoria, contenido } = req.body;
    const { id } = req.params;

    const volverConError = async (mensajeError, imagenActual) => {
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
        const noticias = await obtenerNoticiasParaAdmin();
        return res.status(400).render('admin/noticias/nuevo', {
            title: 'Editar noticia',
            noticias,
            error: mensajeError,
            modoEdicion: true,
            noticiaId: id,
            imagenActual,
            valores: { titulo, categoria, contenido },
        });
    };

    try {
        const noticia = await Noticia.findByPk(id);
        if (!noticia) {
            if (req.file) fs.unlink(req.file.path, () => {});
            return res.status(404).render('error', { message: 'Noticia no encontrada.', error: {} });
        }

        if (!titulo || !contenido) {
            return await volverConError('El título y el contenido son obligatorios.', noticia.imagenUrl);
        }

        const datosActualizados = { titulo, categoria: categoria || null, contenido };

        if (req.file) {
            // Hay imagen nueva: borramos la anterior (si existía) y
            // guardamos la ruta de la nueva.
            if (noticia.imagenUrl) {
                const rutaImagenVieja = path.join(import.meta.dirname, '..', 'public', noticia.imagenUrl);
                fs.unlink(rutaImagenVieja, () => {});
            }
            datosActualizados.imagenUrl = `/uploads/noticias/${req.file.filename}`;
        }

        await noticia.update(datosActualizados);

        registrarActividad(`📰 ADMIN: Noticia editada ("${titulo}").`);

        res.redirect('/admin/noticias');
    } catch (error) {
        next(error);
    }
};

/**
 * Elimina una noticia y, si tenía imagen propia, también borra el archivo
 * del disco (si no, quedaría ocupando espacio para siempre sin que
 * ninguna noticia la use). La confirmación ("¿Seguro que quieres
 * eliminar...?") se pide del lado del navegador, en el propio botón del
 * formulario (ver views/admin/noticias/nuevo.ejs).
 */
export const eliminarNoticia = async (req, res, next) => {
    try {
        const noticia = await Noticia.findByPk(req.params.id);
        if (!noticia) {
            return res.status(404).render('error', { message: 'Noticia no encontrada.', error: {} });
        }

        if (noticia.imagenUrl) {
            const rutaImagen = path.join(import.meta.dirname, '..', 'public', noticia.imagenUrl);
            fs.unlink(rutaImagen, () => {});
        }

        await noticia.destroy();

        registrarActividad(`📰 ADMIN: Noticia eliminada ("${noticia.titulo}").`);

        res.redirect('/admin/noticias');
    } catch (error) {
        next(error);
    }
};