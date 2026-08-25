import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

// La posición de un socio en la escalerilla única y general del club.
// El admin la gestiona manualmente (sin cálculo automático por resultados).
export class EscalerillaPosicion extends Model {}

EscalerillaPosicion.init(
    {
        posicion: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
        },
    },
    {
        sequelize,
        modelName: 'EscalerillaPosicion',
        tableName: 'escalerilla_posiciones',
    }
);