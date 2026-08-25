'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('noticias', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            titulo: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            contenido: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            // Ruta/URL de la imagen de portada de la noticia. Opcional:
            // no todas las noticias necesitan imagen.
            imagenUrl: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            // El admin que la escribio. Se muestra publicada de inmediato
            // (sin estado borrador por ahora).
            autorId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'usuarios',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
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
        await queryInterface.dropTable('noticias');
    },
};