const jwt = require('jsonwebtoken');
const User = require('../../models/User'); // Asegúrate de que User es el modelo correcto

// Middleware para verificar el token
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', ''); // Asegúrate de que el token esté en los encabezados
    
    if (!token) {
      return res.status(401).json({ message: 'No estás autenticado' });
    }

    // Verifica el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Asegúrate de que el JWT_SECRET es el correcto

    // Busca al usuario basado en el ID decodificado del token
    const user = await User.findById(decoded.id); // El id es el que se guarda en el payload del token

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    req.user = user; // Agregar el usuario a la solicitud para usarlo en la ruta
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

module.exports = authMiddleware;
