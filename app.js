// Importación de dependencias externas según el estándar ES6
import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

// Importación de configuración y logger propios del proyecto
import { config } from "./config/config.js";
import { registrarActividad } from "./helpers/logger.js";
import { sequelize } from "./config/sequelize.js";

// Importación de rutas segun el estandar ES6
import indexRouter from "./routes/index.js";
import autenticacionRouter from "./routes/autenticacion.js";
import reservasRouter from "./routes/reservas.js";
import escalerillaRouter from "./routes/escalerilla.js";
import noticiasRouter from "./routes/noticias.js";
import panelSocioRouter from "./routes/panelSocio.js";
import adminRouter from "./routes/admin.js";

// Creación del servidor Express
const app = express();

// Motor de vistas EJS
app.set('views', path.join(import.meta.dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares globales de Express
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(import.meta.dirname, 'public')));

// --- INICIO: Configuración de sesión --- (express-session + connect-pg-simple)
const PgSession = connectPgSimple(session);

registrarActividad("⚙️ SISTEMA: Inicializando el middleware de sesión (express-session + PostgreSQL).");

app.use(session({
    store: new PgSession({
        conObject: {
            host: config.db.host,
            port: config.db.port,
            user: config.db.user,
            password: config.db.password,
            database: config.db.database,
        },
        tableName: 'session',
        createTableIfMissing: false //revisar esta parte porque la del profe se creo manualmente en datagrip
    }),
    secret: config.session.secret,
    resave: false, // no reescribir la sesión si no hubo cambios
    saveUninitialized: false, // no crear una sesión vacía para visitantes anónimos
    cookie: {
        httpOnly: true, // la cookie no es accesible desde JavaScript del navegador
        maxAge: 1000 * 60 * 60 * 2 // 2 horas de duración de la sesión
    }
}));

// Middleware inyector de usuario a todas las vistas
app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario || null;
    next();
});

// Middleware inyector del nombre del club a todas las vistas, para no
// tener que repetirlo en cada res.render() de cada controlador.
app.use((req, res, next) => {
    res.locals.nombreClub = 'PTC - Pichilemu Tennis Club';
    next();
});
// --- FIN: Configuración de sesión ---

// --- INICIO: Verificación Sequelize ---
registrarActividad(`💾 BASE DE DATOS (ORM Sequelize): Verificando conexión con PostgreSQL...`);
try {
    await sequelize.authenticate();
    registrarActividad(`💾 BASE DE DATOS (ORM Sequelize): Conexión establecida con éxito a PostgreSQL.`);
} catch (error) {
    registrarActividad(`💾❌ BASE DE DATOS (ORM Sequelize): No fue posible conectarse a PostgreSQL - ${error.message}.`);
}
// --- FIN: Verificación Sequelize ---

// Rutas del proyecto
app.use('/', indexRouter);
app.use('/autenticacion', autenticacionRouter);
app.use('/reservas', reservasRouter);
app.use('/escalerilla', escalerillaRouter);
app.use('/noticias', noticiasRouter);
app.use('/panel-socio', panelSocioRouter);
app.use('/admin', adminRouter);

// Error 404
app.use((req, res, next) => {
    next(createError(404));
});

// Manejador de errores general
app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    //render the error page
    res.status(err.status || 500);
    res.render('error');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    registrarActividad(`🚀 SERVIDOR: Corriendo en http://localhost:${PORT}`);
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

export default app;