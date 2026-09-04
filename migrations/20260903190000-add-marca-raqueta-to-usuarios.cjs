'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Nullable a nivel de base de datos a propósito: los socios que ya
        // existen (creados antes de este cambio) no tienen este dato y no
        // podemos rellenarlo mágicamente. La obligatoriedad para cuentas
        // NUEVAS se valida en el formulario de registro, no en la base.
        await queryInterface.addColumn('usuarios', 'marcaRaqueta', {
            type: Sequelize.STRING,
            allowNull: true,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('usuarios', 'marcaRaqueta');
    },
};