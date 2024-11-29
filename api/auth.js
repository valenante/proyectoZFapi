// src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Asegúrate de tener un modelo User con un campo 'role'
const authMiddleware = require('../src/middleware/auth'); // Importa el middleware de autenticación
const router = express.Router();
const Password = require('../models/Contraseña'); // Asegúrate de que el modelo Contraseña esté definido correctamente

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

router.put('/setPassword', async (req, res) => {
  try {
      const { password } = req.body;

      // Validación de la contraseña
      if (!password || password.trim() === '') {
          return res.status(400).json({ success: false, message: 'La contraseña no puede estar vacía' });
      }

      // Buscar si ya existe una contraseña
      let existingPassword = await Password.findOne();

      if (existingPassword) {
          // Si existe, la actualizamos
          console.log('Contraseña encontrada, actualizando...');
          existingPassword.password = password;  // Actualizamos el campo 'password' en lugar de 'value'
          await existingPassword.save();
          console.log('Contraseña actualizada:', existingPassword);
          return res.json({ success: true, message: 'Contraseña actualizada correctamente' });
      } else {
          return res.status(404).json({ success: false, message: 'No se encontró una contraseña para actualizar' });
      }
  } catch (error) {
      console.error('Error al actualizar la contraseña:', error);
      res.status(500).json({ success: false, message: 'Error al establecer la contraseña' });
  }
});

// Ruta para obtener la contraseña del día
router.get('/getPassword', async (req, res) => {
  try {
      const passwordRecord = await Password.findOne(); // Obtiene la contraseña guardada
      if (passwordRecord) {
          res.json({ success: true, password: passwordRecord.password });
      } else {
          res.json({ success: false, message: 'No se encontró la contraseña' });
      }
  } catch (error) {
      console.error('Error al obtener la contraseña:', error);
      res.status(500).json({ success: false, message: 'Error interno' });
  }
});

// Ruta para verificar la contraseña en el backend
router.post('/verifyPassword', async (req, res) => {
  try {
    const { password } = req.body;

    // Verifica si la contraseña está en el cuerpo de la solicitud
    console.log("Contraseña recibida:", password);

    // Buscar la contraseña en la base de datos
    const storedPassword = await Password.findOne(); // Asegúrate de tener un esquema Password que guarde la contraseña

    if (!storedPassword) {
      console.log("No se encontró la contraseña en la base de datos");
      return res.status(404).json({ success: false, message: 'No se encontró la contraseña en la base de datos' });
    }

    // Ahora hacemos referencia al campo correcto en el esquema (Password.password)
    console.log("Contraseña almacenada en la base de datos:", storedPassword.password); // Cambié esto

    if (storedPassword.password === password) {
      // Si la contraseña coincide
      console.log("Contraseña correcta");
      return res.json({ success: true });
    } else {
      // Si la contraseña no coincide
      console.log("Contraseña incorrecta");
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }
  } catch (error) {
    console.error('Error al verificar la contraseña:', error);
    res.status(500).json({ success: false, message: 'Error al verificar la contraseña' });
  }
});



module.exports = router;
