'use strict';

// Agrega los datos personales del socio que se piden en el registro desde
// hoy: foto de perfil, edad, sexo, y si juega tenis y/o pádel.
//
// fotoUrl, edad y sexo quedan NULLABLE a nivel de base de datos a propósito
// (mismo criterio que ya usamos con marcaRaqueta): las cuentas creadas ANTES
// de este cambio no tienen estos datos y no podemos inventarlos. La
// obligatoriedad para cuentas NUEVAS se valida en el controlador de
// registro, no acá.
//
// juegaTenis / juegaPadel sí llevan NOT NULL + DEFAULT false: como son
// booleanos con un valor por defecto razonable ("no marcado"), Postgres
// puede rellenar las filas viejas automáticamente con ese default, sin
// dejar ningún hueco nulo que después haya que estar revisando.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('usuarios', 'fotoUrl', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn('usuarios', 'edad', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });

        await queryInterface.addColumn('usuarios', 'sexo', {
            type: Sequelize.ENUM('femenino', 'masculino', 'prefiero_no_decir'),
            allowNull: true,
        });

        await queryInterface.addColumn('usuarios', 'juegaTenis', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });

        await queryInterface.addColumn('usuarios', 'juegaPadel', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('usuarios', 'juegaPadel');
        await queryInterface.removeColumn('usuarios', 'juegaTenis');
        await queryInterface.removeColumn('usuarios', 'sexo');
        await queryInterface.removeColumn('usuarios', 'edad');
        await queryInterface.removeColumn('usuarios', 'fotoUrl');

        // Ojo con este detalle de Postgres: al crear una columna ENUM, Sequelize
        // crea por debajo un TIPO nuevo (acá "enum_usuarios_sexo"). Borrar la
        // COLUMNA no borra ese tipo solo — si no lo borramos a mano, la próxima
        // vez que se intente correr este "up()" de nuevo, fallará con un error
        // de "el tipo ya existe".
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_usuarios_sexo";');
    },
};