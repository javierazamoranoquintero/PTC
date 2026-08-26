import bcrypt from 'bcrypt';

// Cuántas "vueltas" de encriptación aplica bcrypt. Más alto = más lento
// de calcular = más difícil de adivinar por fuerza bruta, pero también
// más lento para el servidor. 10 es el estándar recomendado hoy en día.
const SALT_ROUNDS = 10;

/**
 * Convierte una contraseña en texto plano en un hash irreversible.
 * Esto es lo único que se guarda en la base de datos: NUNCA la
 * contraseña original.
 * @param {String} passwordPlano - La contraseña tal cual la escribió el usuario.
 * @returns {Promise<String>} El hash listo para guardar en Usuario.passwordHash.
 */
export const hashPassword = async (passwordPlano) => {
    return bcrypt.hash(passwordPlano, SALT_ROUNDS);
};

/**
 * Compara una contraseña en texto plano (la que alguien escribió al
 * hacer login) contra el hash guardado en la base de datos.
 * @param {String} passwordPlano - La contraseña escrita en el formulario.
 * @param {String} hashGuardado - El valor de Usuario.passwordHash.
 * @returns {Promise<Boolean>} true si coinciden, false si no.
 */
export const compararPassword = async (passwordPlano, hashGuardado) => {
    return bcrypt.compare(passwordPlano, hashGuardado);
};