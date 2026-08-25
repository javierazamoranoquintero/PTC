'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('canchas', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            nombre: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            tipo: {
                type: Sequelize.ENUM('arcilla', 'padel'),
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
    },

    async down(queryInterface) {
        await queryInterface.dropTable('canchas');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_canchas_tipo";');
    },
};