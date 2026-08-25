import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

// Una reserva de juego libre hecha por un socio (mínimo 1:30, en bloques de 30 min).
export class Reserva extends Model {}

Reserva.init(
    {
        fecha: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        horaInicio: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        horaFin: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        // confirmada: activa. cancelada_socio: la canceló el propio socio (regla de 24h).
        // cancelada_admin: la canceló el club (ej: cierre de cancha por lluvia).
        estado: {
            type: DataTypes.ENUM('confirmada', 'cancelada_socio', 'cancelada_admin'),
            allowNull: false,
            defaultValue: 'confirmada',
        },
    },
    {
        sequelize,
        modelName: 'Reserva',
        tableName: 'reservas',
    }
);