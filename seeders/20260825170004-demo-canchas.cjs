'use strict';

module.exports = {
    async up(queryInterface) {
        await queryInterface.bulkInsert('canchas', [
            { nombre: 'Cancha 1', tipo: 'arcilla', createdAt: new Date(), updatedAt: new Date() },
            { nombre: 'Cancha 2', tipo: 'arcilla', createdAt: new Date(), updatedAt: new Date() },
            { nombre: 'Cancha 3', tipo: 'padel', createdAt: new Date(), updatedAt: new Date() },
        ]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete('canchas', null, {});
    },
};