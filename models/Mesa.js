const mongoose = require('mongoose');

const mesaSchema = new mongoose.Schema({
  numero: {
    type: Number,
    required: true,
  },
  estado: {
    type: String,
    enum: ['abierta', 'cerrada'],
    default: 'abierta',
  },
  pedidos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pedido',  // Referencia a los pedidos regulares
  }],
  pedidoBebidas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PedidoBebida',  // Referencia a los pedidos de bebidas
  }],
  tiempoAbierta: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

const Mesa = mongoose.model('Mesa', mesaSchema);
module.exports = Mesa;
