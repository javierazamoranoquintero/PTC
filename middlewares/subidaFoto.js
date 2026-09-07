// Middleware de subida de archivos (fotos), usando la librería "multer" —
// la forma estándar de manejar formularios con archivos en Express (que
// express.urlencoded() NO sabe hacer, porque un archivo no es texto simple).
//
// Guardamos el archivo directamente en disco, dentro de una subcarpeta de
// public/uploads/ (por ejemplo public/uploads/perfiles/ o
// public/uploads/noticias/), para poder servirlo después con una URL normal
// como /uploads/perfiles/<archivo>.jpg — sin necesitar ninguna ruta ni
// controlador especial para eso, porque app.js ya sirve TODA la carpeta
// public/ como archivos estáticos.
//
// Antes esto solo existía para "perfiles" (fotos de socios). Al agregar
// subida de imágenes para Noticias, se convirtió en una función que arma un
// subidor de fotos para CUALQUIER subcarpeta (crearSubidaFoto), en vez de
// copiar y pegar todo este archivo de nuevo cambiándole el nombre de la
// carpeta — así, si mañana hay que ajustar algo (ej. subir el tamaño máximo
// permitido), se cambia en un solo lugar y aplica a ambos casos.

import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANO_MAXIMO_BYTES = 2 * 1024 * 1024; // 2 MB

function filtroDeArchivo(req, file, cb) {
    if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
        // Este mensaje ('TIPO_NO_PERMITIDO') es un código interno, no texto
        // para mostrarle a la persona directamente: cada controlador que usa
        // este middleware decide qué mensaje amigable mostrar según este
        // código (ver manejarSubidaFotoRegistro / manejarSubidaFotoPerfil /
        // manejarSubidaImagenNoticia).
        return cb(new Error('TIPO_NO_PERMITIDO'));
    }
    cb(null, true);
}

/**
 * Arma un subidor de multer que guarda dentro de
 * public/uploads/<subcarpeta>/, con nombre de archivo único.
 * @param {String} subcarpeta - Nombre de la subcarpeta dentro de public/uploads/ (ej. 'perfiles', 'noticias').
 */
function crearSubidaFoto(subcarpeta) {
    const carpetaDestino = path.join(import.meta.dirname, '..', 'public', 'uploads', subcarpeta);

    // Nos aseguramos de que la carpeta exista ANTES de que multer intente
    // guardar algo ahí. Node no crea carpetas solo porque las necesitemos:
    // si no existe, falla. { recursive: true } además evita un error si la
    // carpeta ya existe.
    fs.mkdirSync(carpetaDestino, { recursive: true });

    const almacenamiento = multer.diskStorage({
        destination: (req, file, cb) => cb(null, carpetaDestino),
        filename: (req, file, cb) => {
            // Nombre único e impredecible (no el nombre original del
            // archivo): así dos subidas al mismo tiempo nunca se pisan
            // entre sí, y nadie puede adivinar el nombre de un archivo
            // ajeno.
            const extension = path.extname(file.originalname).toLowerCase();
            cb(null, `${crypto.randomUUID()}${extension}`);
        },
    });

    return multer({
        storage: almacenamiento,
        fileFilter: filtroDeArchivo,
        limits: { fileSize: TAMANO_MAXIMO_BYTES },
    });
}

// Fotos de perfil de socios → public/uploads/perfiles/
export const subidaFoto = crearSubidaFoto('perfiles');

// Imágenes de Noticias (subidas por el admin) → public/uploads/noticias/
export const subidaFotoNoticia = crearSubidaFoto('noticias');