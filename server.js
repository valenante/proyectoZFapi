const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const cors = require('cors');  // Importar CORS
const http = require('http');
const socketIo = require('socket.io');
const os = require('os');

// Crear un servidor HTTP
const server = http.createServer(app);

// Configurar Socket.io en el servidor, permitiendo CORS
const io = socketIo(server, {
    cors: {
        origin: "*",  // Permitir el origen de tu PWA
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type"],
        credentials: true
    }
});

// Middleware
app.use(cors());  // Permite solicitudes desde cualquier origen
app.use(bodyParser.json()); // Para parsear JSON en las solicitudes
app.use(express.static(path.join(__dirname, 'public'))); // Servir archivos estáticos

// Conexión a la base de datos
mongoose.connect('mongodb://localhost:27017/dbZF', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('No se pudo conectar a MongoDB:', err));

// Importar rutas
const authRoutes = require('./api/auth');
const platoRoutes = require('./api/plato');
const pedidoRoutes = require('./api/pedidos');
const mesaRoutes = require('./api/mesa');
const bebidaRoutes = require('./api/bebidas');
const notificacionesRoutes = require('./api/notificaciones');
const pedidoBebidasRoutes = require('./api/pedidoBebidas');
const mesaEliminadaRoutes = require('./api/mesasEliminadas');
const cerrarCajaRoutes = require('./routes/cerrarCaja');
const ventasRoutes = require('./api/ventas');
const platosEliminadosRoutes = require('./api/platosEliminados');
const bebidasEliminadasRoutes = require('./api/bebidasEliminadas');
const cajasDiariasRoutes = require('./api/cajaDiaria');
const valoracionesRoutes = require('./api/valoraciones');
const cartRoutes = require('./api/cart');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/platos', platoRoutes);
app.use('/api/pedidos', pedidoRoutes(io));
app.use('/api/mesas', mesaRoutes(io));
app.use('/api/pedidoBebidas', pedidoBebidasRoutes(io));
app.use('/api/bebidas', bebidaRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/mesasEliminadas', mesaEliminadaRoutes(io));
app.use('/api/caja', cerrarCajaRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/platosEliminados', platosEliminadosRoutes);
app.use('/api/bebidasEliminadas', bebidasEliminadasRoutes);
app.use('/api/cajaDiaria', cajasDiariasRoutes);
app.use('/api/valoraciones', valoracionesRoutes);
app.use('/api/cart', cartRoutes(io));

// Evento para manejar nuevos pedidos y emitirlos a los clientes
io.on('connection', (socket) => {

    // Escuchar eventos de nuevos pedidos desde el cliente
    socket.on('nuevoPedido', (pedido) => {
        console.log('Nuevo pedido recibido:', pedido);
        // Emitir el nuevo pedido a todos los clientes conectados
        io.emit('actualizarPedidos', pedido);
    });
});

// Configuración del puerto
const PORT = process.env.PORT || 3000;

// Escucha en todas las interfaces de red disponibles
server.listen(PORT, '0.0.0.0', () => {
    // Obtener la IP de la máquina (la que Node.js está usando para escuchar)
    const networkInterfaces = os.networkInterfaces();
    let ipAddress = 'No disponible';

    // Buscar la IP en la interfaz de red local
    for (let interfaceKey in networkInterfaces) {
        for (let iface of networkInterfaces[interfaceKey]) {
            if (!iface.internal && iface.family === 'IPv4') {
                ipAddress = iface.address;
                break;
            }
        }
    }

    console.log(`Servidor escuchando en ${ipAddress}:${PORT}`);
});