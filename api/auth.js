require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Modelo de Usuario
const router = express.Router();

// Login de usuarios
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Busca al usuario por nombre de usuario
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Compara la contraseña ingresada con la almacenada
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Genera un token JWT
        const token = jwt.sign(
            { id: user._id, role: user.role }, // Incluye ID y rol del usuario
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token válido por 1 hora
        );

        // Respuesta con el token y datos del usuario
        res.json({
            message: 'Inicio de sesión exitoso',
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error al iniciar sesión', error });
    }
});

// Registro de usuarios
router.post('/register', async (req, res) => {
    const { username, password, role } = req.body;

    try {
        // Verifica si el usuario ya existe
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Usuario ya existe' });
        }

        // Crea la contraseña encriptada
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crea un nuevo usuario
        const newUser = new User({
            username,
            password: hashedPassword,
            role: role || 'waiter', // Asigna 'waiter' por defecto si no se especifica
        });

        await newUser.save();

        // Genera un token JWT utilizando la variable de entorno JWT_SECRET
        const token = jwt.sign(
            { id: newUser._id, role: newUser.role },
            process.env.JWT_SECRET,  // Aquí toma el valor de la variable de entorno
            { expiresIn: '1h' }
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ message: 'Error al registrar el usuario', error });
    }
});


module.exports = router;
