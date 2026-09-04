'use strict';

// Seeder de datos DE PRUEBA para poder ver la escalerilla funcionando con
// varios tramos de 10 (1-10, 11-20, 21-27) sin tener que crear cuentas a
// mano una por una. Crea 27 socios ficticios con posición asignada.
//
// Para quitar estos datos de prueba más adelante:
//   npx sequelize-cli db:seed:undo --seed 20260903190001-demo-escalerilla-test-data.cjs

const bcrypt = require('bcrypt');

const DOMINIO_PRUEBA = 'escalerilla.prueba.local';
const CANTIDAD_JUGADORES = 27;

const NOMBRES = [
    'Sebastián Zamorano', 'María Valenzuela', 'Matías Fernández', 'Cristian Muñoz', 'Jorge Pino',
    'Felipe Morales', 'Nicolás Carrera', 'Tomás Rivera', 'Alonso Silva', 'Andrés Valdés',
    'Diego Reyes', 'Francisco Soto', 'Ignacio Castro', 'Joaquín Vega', 'Martín Herrera',
    'Pablo Contreras', 'Rodrigo Aguilar', 'Vicente Torres', 'Benjamín Rojas', 'Gabriel Flores',
    'Emilio Sepúlveda', 'Lucas Bravo', 'Maximiliano Cortés', 'Santiago Fuentes', 'Agustín Espinoza',
    'Cristóbal Núñez', 'Simón Araya',
];

const MARCAS_RAQUETA = [
    'Wilson Pro Staff 97', 'Babolat Pure Drive', 'Head Radical', 'Yonex EZONE 98',
    'Wilson Blade 98', 'Head Speed MP', 'Babolat Pure Aero', 'Yonex VCORE 98', 'Wilson Clash 100',
];

module.exports = {
    async up(queryInterface) {
        const passwordHash = await bcrypt.hash('prueba1234', 10);

        const usuarios = NOMBRES.slice(0, CANTIDAD_JUGADORES).map((nombre, i) => ({
            nombre,
            email: `socio${i + 1}@${DOMINIO_PRUEBA}`,
            passwordHash,
            marcaRaqueta: MARCAS_RAQUETA[i % MARCAS_RAQUETA.length],
            rol: 'socio',
            activo: true,
            esProfesor: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

        await queryInterface.bulkInsert('usuarios', usuarios);

        const [usuariosCreados] = await queryInterface.sequelize.query(
            `SELECT id, email FROM usuarios WHERE email LIKE '%@${DOMINIO_PRUEBA}' ORDER BY email;`
        );

        // "email LIKE" con orden alfabético de "socio1@..." mezclaría
        // socio1, socio10, socio11... con socio2; por eso ordenamos acá en
        // JS por el número real extraído del correo, no por texto.
        const usuariosOrdenados = usuariosCreados.sort((a, b) => {
            const numA = parseInt(a.email.match(/socio(\d+)@/)[1], 10);
            const numB = parseInt(b.email.match(/socio(\d+)@/)[1], 10);
            return numA - numB;
        });

        const posiciones = usuariosOrdenados.map((usuario, i) => ({
            usuarioId: usuario.id,
            posicion: i + 1,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

        await queryInterface.bulkInsert('escalerilla_posiciones', posiciones);
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(
            `DELETE FROM escalerilla_posiciones WHERE "usuarioId" IN (SELECT id FROM usuarios WHERE email LIKE '%@${DOMINIO_PRUEBA}');`
        );
        await queryInterface.sequelize.query(`DELETE FROM usuarios WHERE email LIKE '%@${DOMINIO_PRUEBA}';`);
    },
};