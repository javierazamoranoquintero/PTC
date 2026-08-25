import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

// Una clase de tenis dictada por un profesor, en una cancha, con cupo
// definido por el admin. Ocupa siempre 1 hora (2 bloques de 30 min).
export class Clase extends Model {}

Clase.init(
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
        capacidadMaxima: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        // programada: activa. cancelada_admin: el club la canceló
        // (ej: cierre de cancha por lluvia), igual que en Reserva.
        estado: {
            type: DataTypes.ENUM('programada', 'cancelada_admin'),
            allowNull: false,
            defaultValue: 'programada',
        },
    },
    {
        sequelize,
        modelName: 'Clase',
        tableName: 'clases',
    }
);