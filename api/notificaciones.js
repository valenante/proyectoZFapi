const express = require('express');
const router = express.Router();
const http = require('http');
const socketIo = require('socket.io');
const app = express();

// Crear el servidor HTTP para soportar sockets
const server = http.createServer(app);

// Inicializar Socket.io
const io = socketIo(server);


// En el archivo de la ruta
router.post('/notificar-camareros', (req, res) => {
    const { mesa, metodoPago } = req.body;
  
    if (!mesa || !metodoPago) {
      return res.status(400).json({ message: "Faltan parámetros necesarios." });
    }
  
    // Emitir evento a todos los camareros conectados
    io.emit('notificacion-camarero', { mesa, metodoPago });
  
    // Enviar respuesta
    res.status(200).json({ message: `Notificación enviada a los camareros para la mesa ${mesa} con el método de pago ${metodoPago}.` });
});

module.exports = router;