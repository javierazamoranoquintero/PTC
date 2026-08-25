import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

// Un cierre de cancha (ej: por lluvia o mantención) para una cancha
// específica, en un rango de fecha/hora que puede cruzar de un día a otro.
export class CierreCancha extends Model {}

CierreCancha.init(
    {
        fechaHoraInicio: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        fechaHoraFin: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        motivo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'CierreCancha',
        tableName: 'cierre_canchas',
    }
);