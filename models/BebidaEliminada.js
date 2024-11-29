const mongoose = require('mongoose');

const bebidaEliminadaSchema = new mongoose.Schema({
    bebidaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bebida', // Relación con el modelo de bebidas
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

const BebidaEliminada = mongoose.model('BebidaEliminada', bebidaEliminadaSchema);

module.exports = BebidaEliminada;
