'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('escalerilla_posiciones', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            // unique: true -> un socio no puede aparecer dos veces en la escalerilla.
            usuarioId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                unique: true,
                references: {
                    model: 'usuarios',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            // unique: true -> dos socios no pueden ocupar el mismo puesto
            // (1ro, 2do, etc). El admin la actualiza a mano.
            posicion: {
                type: Sequelize.INTEGER,
                allowNull: false,
                unique: true,
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
        await queryInterface.dropTable('escalerilla_posiciones');
    },
};