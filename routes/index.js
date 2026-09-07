import express from 'express';
import { Cancha } from '../models/index.js';
import { obtenerClimaPichilemu } from '../helpers/clima.js';
const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        // Clima real de Pichilemu para el recuadro "Condiciones de Juego en
        // Vivo". Puede ser null si Open-Meteo falla — la vista maneja ese
        // caso mostrando un mensaje en vez de romperse.
        const clima = await obtenerClimaPichilemu();

        res.render('index', {
            title: 'Inicio',
            nombreClub: 'PTC - Pichilemu Tennis Club',
            clima,
        });
    } catch (error) {
        next(error);
    }
});

// Página "Sobre el Club": por ahora es contenido estático (texto e imágenes
// placeholder), por eso no necesita un controlador aparte ni consultar la
// base de datos — igual que la página de Inicio. Los datos de fundadores y
// staff se arman acá como arreglos, y la vista solo los recorre con un
// forEach, en vez de repetir 4 veces casi el mismo bloque de HTML.
router.get('/sobre-el-club', (req, res) => {
    const fundadores = [
        {
            nombre: 'Andrés Vicuña',
            imagen: '/images/fundador-1.jpg',
            bio: 'Empresario local y apasionado del tenis, cuya visión permitió integrar el deporte con el respeto por el entorno natural de Pichilemu.',
        },
        {
            nombre: 'Elena Larraín',
            imagen: '/images/fundador-2.jpg',
            bio: 'Ex tenista profesional dedicada a fomentar el desarrollo de infraestructuras deportivas de alto nivel en zonas costeras.',
        },
    ];

    const staff = [
        {
            nombre: 'Carlos Rivera',
            rol: 'Head Coach',
            imagen: '/images/coach-1.jpg',
            bio: 'Ex jugador profesional con más de 15 años de experiencia formando talentos jóvenes y adultos en la región. Especialista en biomecánica.',
        },
        {
            nombre: 'Sofía Valenzuela',
            rol: 'Coach Físico',
            imagen: '/images/coach-2.jpg',
            bio: 'Preparadora física especializada en deportes de raqueta. Su enfoque integral previene lesiones y maximiza la resistencia en cancha.',
        },
        {
            nombre: 'Mateo Silva',
            rol: 'Coach Junior',
            imagen: '/images/coach-3.jpg',
            bio: 'Especialista en pedagogía deportiva para niños. Su metodología lúdica fomenta el amor por el tenis desde temprana edad.',
        },
        {
            nombre: 'Valentina Paz',
            rol: 'Psicóloga Deportiva',
            imagen: '/images/coach-4.jpg',
            bio: 'Experta en fortaleza mental y manejo de presión en competencia. Trabaja con jugadores de alto rendimiento para optimizar su enfoque.',
        },
    ];

    res.render('sobre-el-club', {
        title: 'Sobre el Club',
        nombreClub: 'PTC - Pichilemu Tennis Club',
        fundadores,
        staff,
    });
});

// Contenido editorial de las canchas: la base de datos solo guarda nombre y
// tipo. Si una cancha real tiene contenido específico (por nombre) lo
// usamos; si no, cae al contenido genérico de su tipo — así una cancha
// nueva siempre muestra algo, sin que tengamos que acordarnos de agregarla.
const CONTENIDO_POR_TIPO = {
    arcilla: {
        etiquetaCard: 'Cancha de Arcilla',
        descripcion: 'Cancha de polvo de ladrillo premium, con un bote parejo gracias al mantenimiento diario y la brisa costera como sello distintivo.',
        features: ['Superficie de arcilla premium', 'Mantenimiento diario', 'Iluminación LED', 'Brisa costera'],
    },
    padel: {
        etiquetaCard: 'Cristal Templado',
        descripcion: 'Cancha panorámica de cristal de última generación, con césped artificial profesional que garantiza un rebote parejo e iluminación pensada para un juego rápido y dinámico.',
        features: ['Cristal templado de alta resistencia', 'Césped sintético profesional', 'Iluminación LED perimetral', 'Homologada para torneos'],
    },
};

const CONTENIDO_POR_NOMBRE = {
    'Cancha 1': {
        etiquetaCard: 'Cancha Central',
        descripcion: 'Nuestra cancha principal de polvo de ladrillo premium. Orientación solar calculada para confort visual en todo momento y vistas ininterrumpidas a la costa.',
        features: ['Orientación solar óptima', 'Vista al océano', 'Iluminación LED pro', 'Bote oficial ITF'],
    },
    'Cancha 2': {
        etiquetaCard: 'Entrenamiento',
        descripcion: 'Ubicada en una zona natural protegida por pinos costeros, minimizando ráfagas de viento y permitiendo sesiones continuas de alta concentración técnica.',
        features: ['Resguardo del viento', 'Entorno de pinos', 'Ideal para entrenamientos', 'Misma calidad de arcilla'],
    },
};

function obtenerContenido(cancha) {
    return CONTENIDO_POR_NOMBRE[cancha.nombre] || CONTENIDO_POR_TIPO[cancha.tipo] || { etiquetaCard: '', descripcion: '', features: [] };
}

router.get('/canchas', async (req, res, next) => {
    try {
        const canchas = await Cancha.findAll({ order: [['id', 'ASC']] });

        const canchasConContenido = canchas.map((cancha) => {
            const contenido = obtenerContenido(cancha);
            return {
                id: cancha.id,
                nombre: cancha.nombre,
                tipo: cancha.tipo,
                etiquetaCard: contenido.etiquetaCard,
                descripcion: contenido.descripcion,
                features: contenido.features,
            };
        });

        res.render('canchas', {
            title: 'Canchas',
            nombreClub: 'PTC - Pichilemu Tennis Club',
            canchasArcilla: canchasConContenido.filter((c) => c.tipo === 'arcilla'),
            canchasPadel: canchasConContenido.filter((c) => c.tipo === 'padel'),
        });
    } catch (error) {
        next(error);
    }
});

export default router;