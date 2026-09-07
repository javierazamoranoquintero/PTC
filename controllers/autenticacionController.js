import fs from 'fs';
import { Usuario } from '../models/index.js';
import { hashPassword, compararPassword } from '../helpers/passwords.js';
import { registrarActividad } from '../helpers/logger.js';
import { subidaFoto } from '../middlewares/subidaFoto.js';

// --- REGISTRO ---

export const mostrarRegistro = (req, res) => {
    res.render('autenticacion/registro', {
        title: 'Crear cuenta',
        error: null,
        valores: {
            nombre: '',
            email: '',
            marcaRaqueta: '',
            edad: '',
            sexo: '',
            juegaTenis: false,
            juegaPadel: false,
        },
    });
};

/**
 * Multer necesita "envolver" a la ruta de una forma distinta al resto de
 * los middlewares del proyecto: si algo sale mal (foto muy pesada, o de un
 * tipo no permitido), Multer llama a su callback CON un error, en vez de
 * simplemente pasarlo a next(error) como hacen nuestros try/catch. Por eso
 * lo manejamos acá mismo, para poder mostrar de nuevo el formulario con un
 * mensaje claro, en vez de la página de error genérica del sistema.
 */
export const manejarSubidaFotoRegistro = (req, res, next) => {
    subidaFoto.single('foto')(req, res, (error) => {
        if (!error) {
            return next();
        }

        res.render('autenticacion/registro', {
            title: 'Crear cuenta',
            error:
                error.message === 'TIPO_NO_PERMITIDO'
                    ? 'La foto debe ser JPG, PNG o WEBP.'
                    : 'La foto no se pudo subir (¿es muy pesada? el máximo es 2MB).',
            valores: {
                nombre: req.body.nombre || '',
                email: req.body.email || '',
                marcaRaqueta: req.body.marcaRaqueta || '',
                edad: req.body.edad || '',
                sexo: req.body.sexo || '',
                juegaTenis: !!req.body.juegaTenis,
                juegaPadel: !!req.body.juegaPadel,
            },
        });
    });
};

export const registrar = async (req, res, next) => {
    const { nombre, email, marcaRaqueta, edad, sexo, password, confirmarPassword } = req.body;
    const juegaTenis = !!req.body.juegaTenis;
    const juegaPadel = !!req.body.juegaPadel;

    // Para repoblar el formulario si algo falla (nunca la password, y
    // tampoco la foto: por seguridad, un <input type="file"> nunca se puede
    // "rellenar de nuevo" desde el servidor, así que si hay un error, la
    // persona tendrá que volver a elegir su foto).
    const valores = { nombre, email, marcaRaqueta, edad, sexo, juegaTenis, juegaPadel };

    // Si ya se alcanzó a guardar una foto en disco (Multer la guarda ANTES
    // de que este controlador se ejecute) pero el registro falla más
    // adelante por otra razón, hay que borrar ese archivo. Si no, quedan
    // fotos "huérfanas" en el servidor para siempre, de gente que nunca
    // llegó a crear su cuenta.
    const volverConError = (mensajeError) => {
        if (req.file) {
            fs.unlink(req.file.path, () => {}); // best-effort: si falla el borrado, no es crítico
        }
        return res.render('autenticacion/registro', {
            title: 'Crear cuenta',
            error: mensajeError,
            valores,
        });
    };

    try {
        // --- Validaciones simples de formulario ---
        if (!nombre || !email || !marcaRaqueta || !edad || !sexo || !password || !confirmarPassword) {
            return volverConError('Todos los campos son obligatorios.');
        }

        if (!req.file) {
            return volverConError('Debes subir una foto de perfil.');
        }

        if (!juegaTenis && !juegaPadel) {
            return volverConError('Indica si juegas tenis, pádel, o ambos.');
        }

        const edadNumero = parseInt(edad, 10);
        if (Number.isNaN(edadNumero) || edadNumero < 3 || edadNumero > 100) {
            return volverConError('Ingresa una edad válida (entre 3 y 100 años).');
        }

        if (password.length < 8) {
            return volverConError('La contraseña debe tener al menos 8 caracteres.');
        }

        if (password !== confirmarPassword) {
            return volverConError('Las contraseñas no coinciden.');
        }

        // --- ¿Ya existe una cuenta con ese correo? ---
        const usuarioExistente = await Usuario.findOne({ where: { email } });
        if (usuarioExistente) {
            return volverConError('Ya existe una cuenta registrada con ese correo.');
        }

        // --- Todo OK: se crea el usuario ---
        // Nunca guardamos "password" tal cual, solo su hash.
        const passwordHash = await hashPassword(password);

        const nuevoUsuario = await Usuario.create({
            nombre,
            email,
            marcaRaqueta,
            edad: edadNumero,
            sexo,
            juegaTenis,
            juegaPadel,
            fotoUrl: `/uploads/perfiles/${req.file.filename}`,
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

