'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('cierre_canchas', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
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
            // Se guardan fecha Y hora juntas (no solo la fecha) porque un
            // cierre puede cruzar de un dia a otro (ej: mantencion de
            // viernes en la tarde a domingo en la manana).
            fechaHoraInicio: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            fechaHoraFin: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            // Ej: "lluvia", "mantencion de la superficie", etc. Este texto
            // es el que se le muestra al socio en su Notificacion.
            motivo: {
                type: Sequelize.STRING,
                allowNull: false,
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
        await queryInterface.dropTable('cierre_canchas');
    },
};