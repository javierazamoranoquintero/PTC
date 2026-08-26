'use strict';

// Esta tabla NO la usa Sequelize directamente: la usa la librería
// connect-pg-simple para guardar las sesiones activas (quién está
// logueado ahora mismo) directamente en Postgres, en vez de en memoria.
// La estructura exacta (nombres de columnas, tipos) viene definida por
// esa librería, no la inventamos nosotras — por eso no es un modelo
// Sequelize como las demás tablas, solo una tabla que debe existir.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('session', {
            sid: {
                type: Sequelize.STRING,
                primaryKey: true,
                allowNull: false,
            },
            sess: {
                type: Sequelize.JSON,
                allowNull: false,
            },
            expire: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        // Índice sobre "expire": connect-pg-simple lo usa para borrar
        // periódicamente las sesiones vencidas de forma eficiente.
        await queryInterface.addIndex('session', ['expire'], {
            name: 'IDX_session_expire',
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('session');
    },
};