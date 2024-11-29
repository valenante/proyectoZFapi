const mongoose = require('mongoose');

const MesaEliminadaSchema = new mongoose.Schema({
    numeroMesa: {
        type: Number,
        required: true
    },
    detallesMesa: {
        type: Object,
        required: true
    },
    pedidosAsociados: {
        type: Array,
        required: true
    },
    pedidosBebidasAsociados: {
        type: Array,
        required: true
    },
    numero: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        default: 0,
    },
    metodoPago: {
        efectivo: {
            type: Number,
            default: 0
        },
        tarjeta: {
            type: Number,
            default: 0
        }
    }
});

// Especificamos el nombre de la colección de manera explícita
const MesaEliminada = mongoose.model('MesaEliminada', MesaEliminadaSchema, 'mesasEliminadas');

module.exports = MesaEliminada;
