import { sequelize } from '../config/sequelize.js';
import { Usuario } from './usuario.js';
import { Cancha } from './cancha.js';
import { Reserva } from './reserva.js';
import { BloqueOcupado } from './bloqueOcupado.js';
import { Clase } from './clase.js';
import { InscripcionClase } from './inscripcionClase.js';
import { CierreCancha } from './cierreCancha.js';
import { Notificacion } from './notificacion.js';
import { Noticia } from './noticia.js';
import { EscalerillaPosicion } from './escalerillaPosicion.js';

// --- Asociaciones entre modelos ---
// Un usuario puede tener muchas reservas; una reserva pertenece a un usuario.
Usuario.hasMany(Reserva, { foreignKey: 'usuarioId' });
Reserva.belongsTo(Usuario, { foreignKey: 'usuarioId' });

// Una cancha puede tener muchas reservas; una reserva pertenece a una cancha.
Cancha.hasMany(Reserva, { foreignKey: 'canchaId' });
Reserva.belongsTo(Cancha, { foreignKey: 'canchaId' });

// Una reserva ocupa uno o más bloques de 30 minutos.
Reserva.hasMany(BloqueOcupado, { foreignKey: 'reservaId' });
BloqueOcupado.belongsTo(Reserva, { foreignKey: 'reservaId' });

// Una cancha acumula muchos bloques ocupados a lo largo del tiempo.
Cancha.hasMany(BloqueOcupado, { foreignKey: 'canchaId' });
BloqueOcupado.belongsTo(Cancha, { foreignKey: 'canchaId' });

// Una cancha puede tener muchas clases; una clase se dicta en una cancha.
Cancha.hasMany(Clase, { foreignKey: 'canchaId' });
Clase.belongsTo(Cancha, { foreignKey: 'canchaId' });

// Un usuario (con esProfesor = true) puede dictar muchas clases;
// una clase tiene un solo profesor a cargo.
Usuario.hasMany(Clase, { foreignKey: 'profesorId' });
Clase.belongsTo(Usuario, { foreignKey: 'profesorId' });

// Una clase tiene muchos socios inscritos, a través de InscripcionClase.
Clase.hasMany(InscripcionClase, { foreignKey: 'claseId' });
InscripcionClase.belongsTo(Clase, { foreignKey: 'claseId' });

// Un usuario (socio) puede tener muchas inscripciones a clases.
Usuario.hasMany(InscripcionClase, { foreignKey: 'usuarioId' });
InscripcionClase.belongsTo(Usuario, { foreignKey: 'usuarioId' });

// Una clase también ocupa uno o más bloques de 30 minutos (igual que una
// reserva). Cada bloque pertenece a una reserva O a una clase, nunca a
// ambas (esa regla la protege el CHECK de la migración).
Clase.hasMany(BloqueOcupado, { foreignKey: 'claseId' });
BloqueOcupado.belongsTo(Clase, { foreignKey: 'claseId' });

// Una cancha puede tener muchos cierres a lo largo del tiempo (lluvia,
// mantención, etc); cada cierre pertenece a una sola cancha.
Cancha.hasMany(CierreCancha, { foreignKey: 'canchaId' });
CierreCancha.belongsTo(Cancha, { foreignKey: 'canchaId' });

// Un cierre de cancha también ocupa bloques de 30 minutos, para que nadie
// pueda reservar encima de un horario cerrado (mismo patrón que Reserva
// y Clase; el CHECK de la migración exige que sea exactamente uno de los 3).
CierreCancha.hasMany(BloqueOcupado, { foreignKey: 'cierreCanchaId' });
BloqueOcupado.belongsTo(CierreCancha, { foreignKey: 'cierreCanchaId' });

// Un usuario puede tener muchas notificaciones (ej: avisos de cancelación).
Usuario.hasMany(Notificacion, { foreignKey: 'usuarioId' });
Notificacion.belongsTo(Usuario, { foreignKey: 'usuarioId' });

// Un usuario (admin) puede ser autor de muchas noticias.
Usuario.hasMany(Noticia, { foreignKey: 'autorId' });
Noticia.belongsTo(Usuario, { foreignKey: 'autorId' });

// Cada usuario tiene, como máximo, UNA posición en la escalerilla
// (relación 1 a 1, por eso hasOne en vez de hasMany).
Usuario.hasOne(EscalerillaPosicion, { foreignKey: 'usuarioId' });
EscalerillaPosicion.belongsTo(Usuario, { foreignKey: 'usuarioId' });

export {
    sequelize,
    Usuario,
    Cancha,
    Reserva,
    BloqueOcupado,
    Clase,
    InscripcionClase,
    CierreCancha,
    Notificacion,
    Noticia,
    EscalerillaPosicion,
};