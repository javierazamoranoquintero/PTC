import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

// Mensaje simple dentro del sistema para avisarle algo a un socio
// (ej: que su reserva fue cancelada por un cierre de cancha).
export class Notificacion extends Model {}

Notificacion.init(
    {
        mensaje: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        leida: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    {
        sequelize,
        modelName: 'Notificacion',
        tableName: 'notificaciones',
    }
);