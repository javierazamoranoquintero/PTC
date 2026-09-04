import dayjs from 'dayjs';
import 'dayjs/locale/es.js';
import { Op } from 'sequelize';
import { Noticia, Torneo } from '../models/index.js';

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