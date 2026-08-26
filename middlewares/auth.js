// Middlewares de autenticación y autorización.
//
// Un "middleware" es una función que se ejecuta ANTES que el controlador
// de la ruta. Sirve para hacer una verificación común a varias rutas
// (acá: "¿está logueado?", "¿es admin?") sin repetir el mismo código
// dentro de cada controlador.

/**
 * Deja pasar solo si hay una sesión activa (req.session.usuario existe).
 * Si no, redirige al login. Úsala en cualquier ruta privada
 * (reservas, perfil, etc).
 */
export const requiereLogin = (req, res, next) => {
    if (!req.session.usuario) {
        return res.redirect('/autenticacion/login');
    }
    next();
};

/**
 * Deja pasar solo si el usuario logueado tiene rol 'admin'. Se usa
 * DESPUÉS de requiereLogin (primero confirmamos que hay sesión, luego
 * el rol), por eso aquí no volvemos a revisar si existe la sesión.
 */
export const requiereAdmin = (req, res, next) => {
    if (req.session.usuario.rol !== 'admin') {
        return res.status(403).render('error', {
            message: 'No tienes permiso para ver esta página.',
            error: {},
        });
    }
    next();
};

/**
 * Para las páginas de login/registro: si la persona YA tiene sesión
 * iniciada, no tiene sentido mostrarle el formulario de nuevo.
 * La mandamos directo al inicio.
 */
export const redirigeSiYaLogueado = (req, res, next) => {
    if (req.session.usuario) {
        return res.redirect('/');
    }
    next();
};