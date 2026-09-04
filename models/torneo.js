import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

// Un torneo del club. El admin lo carga desde un formulario (fecha, nombre,
// detalle) y se muestra públicamente en la sección "Próximas Fechas" de
// Noticias mientras su fecha no haya pasado.
export class Torneo extends Model {}

Torneo.init(
    {
        nombre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        fecha: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        detalle: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'Torneo',
        tableName: 'torneos',
    }
);