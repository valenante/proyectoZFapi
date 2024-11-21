const mongoose = require('mongoose');

const mesaSchema = new mongoose.Schema({
    numero: {
        type: Number,
        required: true,
        unique: true // Asegura que cada mesa tenga un número único
    },
    estado: {
        type: String,
        enum: ['abierta', 'cerrada', 'reservada'],
        default: 'cerrada' // Estado inicial de la mesa
    },
    tiempoAbierta: {
        type: Number,
        default: 0 // Tiempo en minutos que la mesa ha estado abierta
    }
}, { timestamps: true }); // Crea createdAt y updatedAt automáticamente

module.exports = mongoose.model('Mesa', mesaSchema);
