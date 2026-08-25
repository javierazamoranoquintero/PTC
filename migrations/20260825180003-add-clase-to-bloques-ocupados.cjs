'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. La reserva deja de ser obligatoria: un bloque ahora puede
        // pertenecer a una reserva de juego libre O a una clase.
        await queryInterface.changeColumn('bloques_ocupados', 'reservaId', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });

        // 2. Nueva columna para asociar el bloque a una clase.
        await queryInterface.addColumn('bloques_ocupados', 'claseId', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'clases',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });

        // 3. Regla de integridad a nivel de base de datos: cada bloque debe
        // pertenecer a EXACTAMENTE una de las dos (reserva o clase), nunca a
        // ambas ni a ninguna. Se escribe en SQL directo porque es una regla
        // de "o uno o el otro" (XOR) que Sequelize no arma sola.
        await queryInterface.sequelize.query(`
            ALTER TABLE bloques_ocupados
            ADD CONSTRAINT bloques_ocupados_reserva_o_clase_check
            CHECK (
                ("reservaId" IS NOT NULL AND "claseId" IS NULL)
                OR
                ("reservaId" IS NULL AND "claseId" IS NOT NULL)
            );
        `);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(
            'ALTER TABLE bloques_ocupados DROP CONSTRAINT bloques_ocupados_reserva_o_clase_check;'
        );
        await queryInterface.removeColumn('bloques_ocupados', 'claseId');
        await queryInterface.changeColumn('bloques_ocupados', 'reservaId', {
            type: Sequelize.INTEGER,
            allowNull: false,
        });
    },
};