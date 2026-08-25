'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('notificaciones', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            usuarioId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'usuarios',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            // Texto simple mostrado dentro del sistema (ej: "Tu reserva del
            // 2026-09-01 a las 10:00 fue cancelada por mantencion de cancha").
            mensaje: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            leida: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
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
        await queryInterface.dropTable('notificaciones');
    },
};