import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

// Un bloque de 30 minutos ocupado en una cancha. Esta es la tabla que impide
// el doble arriendo: no pueden existir dos registros con la misma
// cancha + fecha + horaInicio (esa regla vive en la migración, a nivel de
// base de datos, no solo aquí).
export class BloqueOcupado extends Model {}

BloqueOcupado.init(
    {
        fecha: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        horaInicio: {
            type: DataTypes.TIME,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'BloqueOcupado',
        tableName: 'bloques_ocupados',
    }
);