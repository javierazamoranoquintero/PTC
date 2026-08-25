'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Nueva columna para asociar un bloque a un cierre de cancha
        // (ej: bloques bloqueados por lluvia, para que nadie los reserve).
        await queryInterface.addColumn('bloques_ocupados', 'cierreCanchaId', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'cierre_canchas',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });

        // 2. La regla "reserva O clase" de la Tanda 2 ya no alcanza: ahora
        // hay 3 origenes posibles. Se elimina el CHECK viejo...
        await queryInterface.sequelize.query(
            'ALTER TABLE bloques_ocupados DROP CONSTRAINT bloques_ocupados_reserva_o_clase_check;'
        );

        // ...y se reemplaza por uno que exige que EXACTAMENTE UNO de los 3
        // este presente. El truco es convertir cada "IS NOT NULL" (que da
        // true/false) a 0/1 con "::int", sumarlos, y exigir que la suma
        // sea exactamente 1.
        await queryInterface.sequelize.query(`
            ALTER TABLE bloques_ocupados
            ADD CONSTRAINT bloques_ocupados_un_solo_origen_check
            CHECK (
                (("reservaId" IS NOT NULL)::int
                 + ("claseId" IS NOT NULL)::int
                 + ("cierreCanchaId" IS NOT NULL)::int) = 1
            );
        `);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(
            'ALTER TABLE bloques_ocupados DROP CONSTRAINT bloques_ocupados_un_solo_origen_check;'
        );
        await queryInterface.sequelize.query(`
            ALTER TABLE bloques_ocupados
            ADD CONSTRAINT bloques_ocupados_reserva_o_clase_check
            CHECK (
                ("reservaId" IS NOT NULL AND "claseId" IS NULL)
                OR
                ("reservaId" IS NULL AND "claseId" IS NOT NULL)
            );
        `);
        await queryInterface.removeColumn('bloques_ocupados', 'cierreCanchaId');
    },
};