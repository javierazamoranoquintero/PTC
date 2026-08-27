'use strict';

// Seeder de datos DE PRUEBA para probar la funcionalidad de "cierre de
// cancha" sin tener que escribir cada INSERT a mano. Crea:
//   - un socio de prueba y un profesor de prueba
//   - una reserva (09:00 a 10:30) y una clase (11:00 a 12:00) en "Cancha 1",
//     el 2026-09-05, con el socio inscrito en la clase
//
// Con eso ya tienes algo real que cancelar cuando pruebes el formulario
// de /admin/cierres/nuevo.
//
// Para quitar estos datos de prueba más adelante:
//   npx sequelize-cli db:seed:undo --seed 20260826000000-demo-cierre-cancha-test-data.cjs

const bcrypt = require('bcrypt');

const FECHA_PRUEBA = '2026-09-05';

module.exports = {
    async up(queryInterface) {
        const passwordHash = await bcrypt.hash('prueba1234', 10);

        // Buscamos el id real de "Cancha 1" en vez de asumir que es 1.
        const [canchas] = await queryInterface.sequelize.query(
            `SELECT id FROM canchas WHERE nombre = 'Cancha 1' LIMIT 1;`
        );
        if (canchas.length === 0) {
            throw new Error('No se encontró "Cancha 1". ¿Corriste el seeder de canchas (demo-canchas)?');
        }
        const canchaId = canchas[0].id;

        await queryInterface.bulkInsert('usuarios', [
            {
                nombre: 'Socio de Prueba',
                email: 'socio.prueba@ptc.local',
                passwordHash,
                rol: 'socio',
                activo: true,
                esProfesor: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                nombre: 'Profesor de Prueba',
                email: 'profesor.prueba@ptc.local',
                passwordHash,
                rol: 'socio',
                activo: true,
                esProfesor: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);

        const [usuarios] = await queryInterface.sequelize.query(
            `SELECT id, email FROM usuarios WHERE email IN ('socio.prueba@ptc.local', 'profesor.prueba@ptc.local');`
        );
        const socioId = usuarios.find((u) => u.email === 'socio.prueba@ptc.local').id;
        const profesorId = usuarios.find((u) => u.email === 'profesor.prueba@ptc.local').id;

        // Reserva de prueba: 09:00 a 10:30 (3 bloques de 30 min).
        await queryInterface.bulkInsert('reservas', [
            {
                canchaId,
                usuarioId: socioId,
                fecha: FECHA_PRUEBA,
                horaInicio: '09:00:00',
                horaFin: '10:30:00',
                estado: 'confirmada',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
        const [reservas] = await queryInterface.sequelize.query(
            `SELECT id FROM reservas WHERE "canchaId" = ${canchaId} AND fecha = '${FECHA_PRUEBA}' AND "horaInicio" = '09:00:00';`
        );
        const reservaId = reservas[0].id;

        // Clase de prueba: 11:00 a 12:00 (2 bloques de 30 min).
        await queryInterface.bulkInsert('clases', [
            {
                canchaId,
                profesorId,
                fecha: FECHA_PRUEBA,
                horaInicio: '11:00:00',
                horaFin: '12:00:00',
                capacidadMaxima: 4,
                estado: 'programada',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
        const [clases] = await queryInterface.sequelize.query(
            `SELECT id FROM clases WHERE "canchaId" = ${canchaId} AND fecha = '${FECHA_PRUEBA}' AND "horaInicio" = '11:00:00';`
        );
        const claseId = clases[0].id;

        await queryInterface.bulkInsert('inscripciones_clase', [
            {
                claseId,
                usuarioId: socioId,
                estado: 'inscrito',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);

        // Bloques ocupados: 3 de la reserva + 2 de la clase.
        const bloquesReserva = ['09:00:00', '09:30:00', '10:00:00'].map((hora) => ({
            canchaId,
            fecha: FECHA_PRUEBA,
            horaInicio: hora,
            reservaId,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
        const bloquesClase = ['11:00:00', '11:30:00'].map((hora) => ({
            canchaId,
            fecha: FECHA_PRUEBA,
            horaInicio: hora,
            claseId,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
        await queryInterface.bulkInsert('bloques_ocupados', [...bloquesReserva, ...bloquesClase]);
    },

    async down(queryInterface) {
        // Deshacemos todo en orden inverso (primero lo que depende de lo demás).
        await queryInterface.sequelize.query(`DELETE FROM bloques_ocupados WHERE fecha = '${FECHA_PRUEBA}';`);
        await queryInterface.sequelize.query(
            `DELETE FROM inscripciones_clase WHERE "usuarioId" IN (SELECT id FROM usuarios WHERE email LIKE '%.prueba@ptc.local');`
        );
        await queryInterface.sequelize.query(`DELETE FROM clases WHERE fecha = '${FECHA_PRUEBA}';`);
        await queryInterface.sequelize.query(`DELETE FROM reservas WHERE fecha = '${FECHA_PRUEBA}';`);
        await queryInterface.sequelize.query(`DELETE FROM usuarios WHERE email LIKE '%.prueba@ptc.local';`);
    },
};