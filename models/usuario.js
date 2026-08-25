import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

// Representa a un socio o a un administrador del club.
export class Usuario extends Model {}

Usuario.init(
    {
        nombre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        // Nunca se guarda la contraseña real, solo su hash (bcrypt).
        passwordHash: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        rol: {
            type: DataTypes.ENUM('socio', 'admin'),
            allowNull: false,
            defaultValue: 'socio',
        },
        activo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        // Un profesor sigue siendo un socio normal (juega, reserva cancha,
        // participa en la escalerilla). Esta etiqueta solo le agrega la
        // vista de "mis clases" en su perfil. No es un rol de permisos.
        esProfesor: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    {
        sequelize,
        modelName: 'Usuario',
        tableName: 'usuarios',
    }
);