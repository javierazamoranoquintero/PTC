'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('reservas', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            usuarioId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'usuarios',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            canchaId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'canchas',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            fecha: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            horaInicio: {
                type: Sequelize.TIME,
                allowNull: false,
            },
            horaFin: {
                type: Sequelize.TIME,
                allowNull: false,
            },
            estado: {
                type: Sequelize.ENUM('confirmada', 'cancelada_socio', 'cancelada_admin'),
                allowNull: false,
                defaultValue: 'confirmada',
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('reservas');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reservas_estado";');
    },
};