import { registrarActividad } from './logger.js';

// Coordenadas aproximadas de Pichilemu. Se usan en más de una página
// (Panel del Socio, Inicio), por eso viven acá en un solo lugar en vez de
// repetirse en cada controlador que necesite el clima.
const LATITUD_PICHILEMU = -34.39;
const LONGITUD_PICHILEMU = -72.01;

// Open-Meteo devuelve el clima como un "código WMO" (un número), no como
// texto. Esta tabla traduce los códigos más comunes a una descripción corta
// en español y a una categoría simple ('sol' | 'nublado' | 'lluvia' |
// 'nieve' | 'tormenta'), que las vistas usan para elegir qué ícono mostrar.
// Tabla completa: https://open-meteo.com/en/docs (sección "WMO Weather code")
export function interpretarCodigoClima(codigo) {
    const tabla = {
        0: { descripcion: 'Despejado', categoria: 'sol' },
        1: { descripcion: 'Mayormente despejado', categoria: 'sol' },
        2: { descripcion: 'Parcialmente nublado', categoria: 'nublado' },
        3: { descripcion: 'Nublado', categoria: 'nublado' },
        45: { descripcion: 'Con niebla', categoria: 'nublado' },
        48: { descripcion: 'Con niebla', categoria: 'nublado' },
        51: { descripcion: 'Llovizna leve', categoria: 'lluvia' },
        53: { descripcion: 'Llovizna', categoria: 'lluvia' },
        55: { descripcion: 'Llovizna intensa', categoria: 'lluvia' },
        61: { descripcion: 'Lluvia leve', categoria: 'lluvia' },
        63: { descripcion: 'Lluvia', categoria: 'lluvia' },
        65: { descripcion: 'Lluvia intensa', categoria: 'lluvia' },
        71: { descripcion: 'Nieve leve', categoria: 'nieve' },
        73: { descripcion: 'Nieve', categoria: 'nieve' },
        75: { descripcion: 'Nieve intensa', categoria: 'nieve' },
        80: { descripcion: 'Chubascos', categoria: 'lluvia' },
        81: { descripcion: 'Chubascos', categoria: 'lluvia' },
        82: { descripcion: 'Chubascos intensos', categoria: 'lluvia' },
        95: { descripcion: 'Tormenta eléctrica', categoria: 'tormenta' },
        96: { descripcion: 'Tormenta con granizo', categoria: 'tormenta' },
        99: { descripcion: 'Tormenta con granizo', categoria: 'tormenta' },
    };
    // Si el código no está en la tabla (Open-Meteo agrega códigos nuevos de
    // vez en cuando), se cae a "Nublado" en vez de romper la página.
    return tabla[codigo] || { descripcion: 'Nublado', categoria: 'nublado' };
}

/**
 * Clima actual real de Pichilemu desde Open-Meteo (API pública gratuita,
 * sin API key). Se usa tanto en Inicio como en Panel del Socio, por eso es
 * un helper compartido en vez de código repetido en cada controlador.
 *
 * Devuelve: { temperatura, viento, humedad, uvMax, descripcion, categoria }
 * o null si el servicio externo falla por cualquier motivo.
 *
 * Importante: esto es una llamada a un servicio EXTERNO, fuera de nuestro
 * control. Si Open-Meteo está caído, lento, o cambia su formato de
 * respuesta, NO debe tumbar ninguna página del sitio — por eso todo el
 * bloque va en un try/catch que, ante cualquier problema, retorna null en
 * vez de propagar el error. Cada vista decide qué mostrar cuando esto pasa
 * (típicamente "clima no disponible por el momento").
 */
export async function obtenerClimaPichilemu() {
    try {
        const controlador = new AbortController();
        const timeoutId = setTimeout(() => controlador.abort(), 4000); // no esperar para siempre

        const url =
            `https://api.open-meteo.com/v1/forecast?latitude=${LATITUD_PICHILEMU}&longitude=${LONGITUD_PICHILEMU}` +
            `&current=temperature_2m,wind_speed_10m,weather_code,relative_humidity_2m` +
            `&daily=uv_index_max&timezone=America%2FSantiago`;

        const respuesta = await fetch(url, { signal: controlador.signal });
        clearTimeout(timeoutId);

        if (!respuesta.ok) {
            return null;
        }

        const datos = await respuesta.json();
        const { descripcion, categoria } = interpretarCodigoClima(datos.current.weather_code);

        return {
            temperatura: Math.round(datos.current.temperature_2m),
            viento: Math.round(datos.current.wind_speed_10m),
            humedad: Math.round(datos.current.relative_humidity_2m),
            // "daily.uv_index_max" es un arreglo (uno por día pronosticado);
            // la posición 0 es siempre el día de hoy.
            uvMax: Math.round(datos.daily.uv_index_max[0]),
            descripcion,
            categoria,
        };
    } catch (error) {
        // No se usa next(error): el clima es un dato opcional, no un error
        // grave del sistema. Solo se deja registrado para poder revisarlo.
        registrarActividad(`🌤️⚠️ CLIMA: No se pudo obtener el clima de Pichilemu -> ${error.message}.`);
        return null;
    }
}