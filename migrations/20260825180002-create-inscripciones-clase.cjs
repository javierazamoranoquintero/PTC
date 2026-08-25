'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('inscripciones_clase', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            claseId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'clases',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            usuarioId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'usuarios',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            // inscrito: activa. cancelada_socio / cancelada_admin: misma
            // logica que en Reserva (regla de 24 horas para el socio).
            estado: {
                type: Sequelize.ENUM('inscrito', 'cancelada_socio', 'cancelada_admin'),
                allowNull: false,
                defaultValue: 'inscrito',
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

        // Indice unico PARCIAL: solo cuenta a las inscripciones con
        // estado 'inscrito'. Asi, un socio no puede inscribirse dos veces
        // (activamente) a la misma clase, pero SI puede volver a inscribirse
        // despues de haber cancelado una vez (esa fila vieja queda con
        // estado 'cancelada_socio' y ya no choca con la restriccion).
        await queryInterface.addIndex('inscripciones_clase', ['claseId', 'usuarioId'], {
            name: 'inscripciones_clase_activa_unique',
            unique: true,
            where: {
                estado: 'inscrito',
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex('inscripciones_clase', 'inscripciones_clase_activa_unique');
        await queryInterface.dropTable('inscripciones_clase');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inscripciones_clase_estado";');
    },
};