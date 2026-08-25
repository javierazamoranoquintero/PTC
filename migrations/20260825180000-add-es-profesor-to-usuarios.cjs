'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Un profesor sigue siendo un socio normal (puede jugar, reservar
        // cancha, participar en la escalerilla, etc). Esta columna solo le
        // agrega una "etiqueta": si es true, en su perfil vera ademas sus
        // clases asignadas. No reemplaza al campo 'rol', que sigue siendo
        // sobre permisos (socio/admin).
        await queryInterface.addColumn('usuarios', 'esProfesor', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('usuarios', 'esProfesor');
    },
};