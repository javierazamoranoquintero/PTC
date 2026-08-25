import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

// La inscripción de un socio a una clase. inscrito: activa.
// cancelada_socio / cancelada_admin: misma lógica que en Reserva (regla
// de 24 horas para que el socio se desinscriba).
export class InscripcionClase extends Model {}

InscripcionClase.init(
    {
        estado: {
            type: DataTypes.ENUM('inscrito', 'cancelada_socio', 'cancelada_admin'),
            allowNull: false,
            defaultValue: 'inscrito',
        },
    },
    {
        sequelize,
        modelName: 'InscripcionClase',
        tableName: 'inscripciones_clase',
    }
);