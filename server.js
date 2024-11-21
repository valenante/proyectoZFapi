const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const cors = require('cors');

// Middleware
app.use(cors());
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
const authRoutes = require('./api/auth'); // Ajusta según la ubicación
const platoRoutes = require('./api/plato'); // Ajusta según la ubicación
const pedidoRoutes = require('./api/pedidos'); // Ajusta según la ubicación
const mesaRoutes = require('./api/mesa'); // Ajusta según la ubicación
const bebidaRoutes = require('./api/bebidas'); // Ajusta según la ubicación
const notificacionesRoutes = require('./api/notificaciones'); // Ajusta según la ubicación
const pedidoBebidasRoutes = require('./api/pedidoBebidas'); // Ajusta según la ubicación
// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/platos', platoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/mesas', mesaRoutes);
app.use('/api/bebidas', bebidaRoutes); // Ajusta según la ubicación
app.use('/api/notificaciones', notificacionesRoutes); // Ajusta según la ubicación
app.use('/api/pedidoBebidas', pedidoBebidasRoutes); // Ajusta según la ubicación

// Configuración del puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
