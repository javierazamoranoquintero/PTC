'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('bloques_ocupados', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
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
            reservaId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'reservas',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            fecha: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            horaInicio: {
                type: Sequelize.TIME,
                allowNull: false,
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

        // La regla clave anti-doble-arriendo: nunca puede haber dos bloques
        // ocupados para la misma cancha, misma fecha y misma hora de inicio.
        await queryInterface.addConstraint('bloques_ocupados', {
            fields: ['canchaId', 'fecha', 'horaInicio'],
            type: 'unique',
            name: 'bloques_ocupados_cancha_fecha_hora_unique',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('bloques_ocupados');
    },
};