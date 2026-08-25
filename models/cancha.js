import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

// Las 3 canchas del club (2 de arcilla + 1 de pádel).
export class Cancha extends Model {}

Cancha.init(
    {
        nombre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        tipo: {
            type: DataTypes.ENUM('arcilla', 'padel'),
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'Cancha',
        tableName: 'canchas',
    }
);