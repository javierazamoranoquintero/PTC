'use strict';

// Seeder de datos DE PRUEBA para la página pública de Noticias. Todavía no
// existe un panel de administración para crear noticias (solo para
// torneos, que sí se puede probar con el formulario real en
// /admin/torneos/nuevo), así que esto sirve para ver la página de
// Noticias funcionando con datos reales de la base de datos en vez de
// vacía.
//
// Crea:
//   - un admin de prueba (autor/creador de todo lo de acá abajo)
//   - 4 noticias: 1 con categoria 'Torneo' (se muestra como "Torneo
//     Destacado") y 3 más con otras categorías (se muestran en
//     "Artículos y Novedades")
//   - 2 torneos con fecha futura (relativa a HOY, para que no queden
//     "vencidos" con el paso del tiempo y dejen de aparecer en
//     "Próximas Fechas")
//
// Para quitar estos datos de prueba más adelante:
//   npx sequelize-cli db:seed:undo --seed 20260904150002-demo-noticias-torneos-test-data.cjs

const bcrypt = require('bcrypt');
const dayjs = require('dayjs');

const EMAIL_ADMIN_PRUEBA = 'admin.demo@ptc.local';

module.exports = {
    async up(queryInterface) {
        const passwordHash = await bcrypt.hash('prueba1234', 10);

        await queryInterface.bulkInsert('usuarios', [
            {
                nombre: 'Admin de Prueba',
                email: EMAIL_ADMIN_PRUEBA,
                passwordHash,
                rol: 'admin',
                activo: true,
                esProfesor: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);

        const [admins] = await queryInterface.sequelize.query(
            `SELECT id FROM usuarios WHERE email = '${EMAIL_ADMIN_PRUEBA}' LIMIT 1;`
        );
        const adminId = admins[0].id;

        await queryInterface.bulkInsert('noticias', [
            {
                titulo: 'Open Pichilemu 2026',
                contenido: 'Sebastián González se coronó campeón en una final reñida frente a Ricardo Valenzuela (6-4, 7-6), cerrando un torneo con gran nivel de juego en todas las categorías.',
                imagenUrl: null,
                categoria: 'Torneo',
                autorId: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                titulo: 'Mantenimiento de canchas de arcilla de cara al verano',
                contenido: 'Nuestro equipo realiza un proceso riguroso para mantener las canchas en estado óptimo, garantizando el mejor bote y cuidando las articulaciones de quienes juegan.',
                imagenUrl: null,
                categoria: 'Mantenimiento',
                autorId: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                titulo: 'Nuevos horarios de verano',
                contenido: 'A partir de diciembre ampliamos nuestros horarios de atención para que puedas disfrutar de las tardes largas de verano. Revisa la nueva parrilla de reservas.',
                imagenUrl: null,
                categoria: 'Avisos',
                autorId: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                titulo: 'Tips para mejorar tu revés a una mano',
                contenido: 'Nuestro entrenador jefe comparte tres ejercicios clave para ganar estabilidad y potencia en uno de los golpes más elegantes pero difíciles del tenis.',
                imagenUrl: null,
                categoria: 'Tips de Juego',
                autorId: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);

        await queryInterface.bulkInsert('torneos', [
            {
                nombre: 'Torneo de Dobles Primavera',
                fecha: dayjs().add(20, 'day').format('YYYY-MM-DD'),
                detalle: 'Inscripciones abiertas',
                creadoPorId: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                nombre: 'Copa Junior Coastal',
                fecha: dayjs().add(45, 'day').format('YYYY-MM-DD'),
                detalle: 'Categorías Sub-14 y Sub-16',
                creadoPorId: adminId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
    },

    async down(queryInterface) {
        // Orden inverso: primero lo que depende del admin de prueba.
        await queryInterface.sequelize.query(
            `DELETE FROM torneos WHERE "creadoPorId" IN (SELECT id FROM usuarios WHERE email = '${EMAIL_ADMIN_PRUEBA}');`
        );
        await queryInterface.sequelize.query(
            `DELETE FROM noticias WHERE "autorId" IN (SELECT id FROM usuarios WHERE email = '${EMAIL_ADMIN_PRUEBA}');`
        );
        await queryInterface.sequelize.query(`DELETE FROM usuarios WHERE email = '${EMAIL_ADMIN_PRUEBA}';`);
    },
};