const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado, token no proporcionado' });
    }

    try {
        // Verifica el token usando el secreto adecuado
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  // Esto contendrá la información del usuario decodificada

        next();  // Continuar con la solicitud
    } catch (error) {
        console.error("Error al verificar el token:", error);  // Verifica los errores en la validación del token
        return res.status(401).json({ error: 'Token no válido' });
    }
};


module.exports = authenticateToken;