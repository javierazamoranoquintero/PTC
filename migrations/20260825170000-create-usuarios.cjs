'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('usuarios', {
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
            email: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            passwordHash: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            rol: {
                type: Sequelize.ENUM('socio', 'admin'),
                allowNull: false,
                defaultValue: 'socio',
            },
            activo: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
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
        await queryInterface.dropTable('usuarios');
        // Postgres no borra los tipos ENUM solos al borrar la tabla, hay que limpiarlos a mano
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_usuarios_rol";');
    },
};