require('dotenv').config();

const configComun = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: 'postgres',
};

module.exports = {
    development: configComun,
    test: configComun,
    production: configComun,
};