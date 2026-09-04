import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

// Una noticia del club, visible públicamente. Se publica de inmediato al
// crearla (sin estado de borrador, por ahora).
export class Noticia extends Model {}

Noticia.init(
    {
        titulo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        contenido: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        imagenUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // Etiqueta corta para agrupar/mostrar la noticia (ej. "Mantenimiento",
        // "Avisos", "Tips de Juego"). La categoría especial 'Torneo' se usa
        // para identificar la noticia que se muestra como "Torneo Destacado"
        // en la página pública de Noticias.
        categoria: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'Noticia',
        tableName: 'noticias',
    }
);