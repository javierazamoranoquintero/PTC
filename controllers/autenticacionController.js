import { Usuario } from '../models/index.js';
import { hashPassword, compararPassword } from '../helpers/passwords.js';
import { registrarActividad } from '../helpers/logger.js';

// --- REGISTRO ---

export const mostrarRegistro = (req, res) => {
    res.render('autenticacion/registro', {
        title: 'Crear cuenta',
        error: null,
        valores: { nombre: '', email: '', marcaRaqueta: '' },
    });
};

export const registrar = async (req, res, next) => {
    const { nombre, email, marcaRaqueta, password, confirmarPassword } = req.body;
    const valores = { nombre, email, marcaRaqueta }; // para repoblar el formulario si algo falla (nunca la password)

    try {
        // --- Validaciones simples de formulario ---
        if (!nombre || !email || !marcaRaqueta || !password || !confirmarPassword) {
            return res.render('autenticacion/registro', {
                title: 'Crear cuenta',
                error: 'Todos los campos son obligatorios.',
                valores,
            });
        }

        if (password.length < 8) {
            return res.render('autenticacion/registro', {
                title: 'Crear cuenta',
                error: 'La contraseña debe tener al menos 8 caracteres.',
                valores,
            });
        }

        if (password !== confirmarPassword) {
            return res.render('autenticacion/registro', {
                title: 'Crear cuenta',
                error: 'Las contraseñas no coinciden.',
                valores,
            });
        }

        // --- ¿Ya existe una cuenta con ese correo? ---
        const usuarioExistente = await Usuario.findOne({ where: { email } });
        if (usuarioExistente) {
            return res.render('autenticacion/registro', {
                title: 'Crear cuenta',
                error: 'Ya existe una cuenta registrada con ese correo.',
                valores,
            });
        }

        // --- Todo OK: se crea el usuario ---
        // Nunca guardamos "password" tal cual, solo su hash.
        const passwordHash = await hashPassword(password);

        const nuevoUsuario = await Usuario.create({
            nombre,
            email,
            marcaRaqueta,
            passwordHash,
            rol: 'socio', // el registro público SIEMPRE crea socios; nunca admins
        });

        registrarActividad(`👤 REGISTRO: Nueva cuenta creada -> ${nuevoUsuario.email} (id ${nuevoUsuario.id}).`);

        // Auto-login: para no obligar a la persona a loguearse otra vez
        // justo después de registrarse.
        req.session.usuario = {
            id: nuevoUsuario.id,
            nombre: nuevoUsuario.nombre,
            email: nuevoUsuario.email,
            rol: nuevoUsuario.rol,
            esProfesor: nuevoUsuario.esProfesor,
        };

        res.redirect('/');
    } catch (error) {
        // Cualquier error inesperado (ej: la base de datos no responde)
        // se lo pasamos al manejador de errores global de app.js con next(error),
        // en vez de dejar que la app se caiga sin explicación.
        next(error);
    }
};

// --- LOGIN ---

export const mostrarLogin = (req, res) => {
    res.render('autenticacion/login', {
        title: 'Iniciar sesión',
        error: null,
        valores: { email: '' },
    });
};

export const iniciarSesion = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.render('autenticacion/login', {
                title: 'Iniciar sesión',
                error: 'Ingresa tu correo y tu contraseña.',
                valores: { email },
            });
        }

        const usuario = await Usuario.findOne({ where: { email } });

        // OJO: el mensaje de error es EL MISMO tanto si el correo no existe
        // como si la contraseña es incorrecta. Es a propósito: si dijéramos
        // "ese correo no existe" le estaríamos regalando a un atacante la
        // información de qué correos SÍ están registrados en el club.
        const credencialesInvalidas = () =>
            res.render('autenticacion/login', {
                title: 'Iniciar sesión',
                error: 'Correo o contraseña incorrectos.',
                valores: { email },
            });

        if (!usuario) {
            return credencialesInvalidas();
        }

        if (!usuario.activo) {
            return res.render('autenticacion/login', {
                title: 'Iniciar sesión',
                error: 'Esta cuenta está deshabilitada. Contacta a la administración del club.',
                valores: { email },
            });
        }

        const passwordCorrecta = await compararPassword(password, usuario.passwordHash);
        if (!passwordCorrecta) {
            return credencialesInvalidas();
        }

        req.session.usuario = {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            esProfesor: usuario.esProfesor,
        };

        registrarActividad(`🔓 LOGIN: ${usuario.email} inició sesión.`);

        res.redirect('/');
    } catch (error) {
        next(error);
    }
};

// --- LOGOUT ---

export const cerrarSesion = (req, res, next) => {
    const email = req.session.usuario?.email;

    req.session.destroy((error) => {
        if (error) {
            return next(error);
        }
        registrarActividad(`🔒 LOGOUT: ${email ?? 'usuario desconocido'} cerró sesión.`);
        res.clearCookie('connect.sid'); // limpia la cookie de sesión del navegador
        res.redirect('/');
    });
};