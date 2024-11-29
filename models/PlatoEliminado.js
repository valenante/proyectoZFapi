const mongoose = require('mongoose');

const platoEliminadoSchema = new mongoose.Schema({
    platoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plato', // Relación con el modelo de platos
        required: true
    },
    pedidoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pedido', // Relación con el modelo de pedidos
        required: true
    },
    mesaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mesa', // Relación con el modelo de mesas
        required: true
    },
    cantidad: {
        type: Number,
        required: true
    },
    motivoEliminacion: {
        type: String,
        default: 'No especificado' // Puedes agregar un motivo si lo deseas
    },
    fechaEliminacion: {
        type: Date,
        default: Date.now
    }
});

const PlatoEliminado = mongoose.model('PlatoEliminado', platoEliminadoSchema);

module.exports = PlatoEliminado;
