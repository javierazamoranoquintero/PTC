'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('clases', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            fecha: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            horaInicio: {
                type: Sequelize.TIME,
                allowNull: false,
            },
            // Siempre horaInicio + 1 hora (2 bloques de 30 min), pero se
            // guarda explicito para que las consultas de disponibilidad no
            // tengan que recalcularlo cada vez.
            horaFin: {
                type: Sequelize.TIME,
                allowNull: false,
            },
            canchaId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'canchas',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            // Debe ser un Usuario con esProfesor = true. Esa validacion no
            // la hace la base de datos (no tenemos forma simple de exigir
            // "esta FK solo puede apuntar a filas con tal columna en true"),
            // se hace en el codigo de la aplicacion cuando el admin arma
            // la clase.
            profesorId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'usuarios',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            // Cupo maximo de socios inscritos. Lo define el admin al crear
            // cada clase (no es un numero fijo del sistema).
            capacidadMaxima: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            // programada: activa. cancelada_admin: el club la cancelo
            // (ej: cierre de cancha por lluvia), igual que en Reserva.
            estado: {
                type: Sequelize.ENUM('programada', 'cancelada_admin'),
                allowNull: false,
                defaultValue: 'programada',
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
        await queryInterface.dropTable('clases');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_clases_estado";');
    },
};