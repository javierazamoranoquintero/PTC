import { sequelize } from '../config/sequelize.js';
import { Usuario } from './usuario.js';
import { Cancha } from './cancha.js';
import { Reserva } from './reserva.js';
import { BloqueOcupado } from './bloqueOcupado.js';

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

export { sequelize, Usuario, Cancha, Reserva, BloqueOcupado };