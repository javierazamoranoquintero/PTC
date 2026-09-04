'use strict';

// Tabla nueva para que el admin pueda cargar fechas de torneos desde un
// formulario (en vez de que "Próximas Fechas" en Noticias sea texto fijo
// que nunca cambia). Cada fila es UN torneo futuro.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('torneos', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            nombre: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            fecha: {
                // Solo la fecha (sin hora) — un torneo se anuncia para un día,
                // no para una hora exacta como una reserva o una clase.
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            detalle: {
                // Texto corto libre, ej: "Inscripciones abiertas" o
                // "Categorías Sub-14 y Sub-16". Opcional.
                type: Sequelize.STRING,
                allowNull: true,
            },
            creadoPorId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'usuarios',
                    key: 'id',
                },
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('torneos');
    },
};