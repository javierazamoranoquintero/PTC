'use strict';

// Agrega la etiqueta de categoría que se muestra en cada artículo de la
// página de Noticias (ej. "Mantenimiento", "Avisos", "Tips de Juego").
// También usamos la categoría especial 'Torneo' para identificar la noticia
// que se muestra como "Torneo Destacado" arriba de la página.
//
// Nullable a nivel de base de datos (igual que hicimos con marcaRaqueta):
// así no rompemos ninguna noticia que ya exista sin este dato.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('noticias', 'categoria', {
            type: Sequelize.STRING,
            allowNull: true,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('noticias', 'categoria');
    },
};