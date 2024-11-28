// src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Asegúrate de tener un modelo User con un campo 'role'
const authMiddleware = require('../src/middleware/auth'); // Importa el middleware de autenticación
const router = express.Router();

// Ruta protegida
router.get('/', authMiddleware, async (req, res) => {
    try {
      const user = req.user; // El usuario que se obtiene desde el middleware
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener el usuario', error });
    }
  });

// Ruta para registrar un nuevo usuario (solo un admin puede hacerlo)
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

    console.log(role);  // Verifica si el rol se recibe correctamente
    
  try {
    
    // Verifica si el usuario ya existe
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Hashea la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crea un nuevo usuario
    const newUser = new User({ username, password: hashedPassword, role });
    await newUser.save();

    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar el usuario', error });
  }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      // Busca el usuario en la base de datos
      const user = await User.findOne({ username });
      if (!user) {
        console.log("Usuario no encontrado: " + username);
        return res.status(400).json({ message: 'Credenciales inválidas' });
      }
  
      // Compara las contraseñas
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.log("Contraseña inválida para el usuario: " + username);
        return res.status(400).json({ message: 'Credenciales inválidas' });
      }
  
      // Crea un token JWT con el ID del usuario
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      console.log("Token generado:", token);  // Verifica que el token sea generado correctamente
  
      res.json({ token });
    } catch (error) {
      console.log("Error al iniciar sesión:", error); // Verifica si hay algún error en el servidor
      res.status(500).json({ message: 'Error al iniciar sesión', error });
    }
  });
  

module.exports = router;
