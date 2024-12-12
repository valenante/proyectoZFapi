const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ventaSchema = new Schema({
  platoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plato',
  },
  bebidaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bebida',
  },
  pedidoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pedido',
    required: true
  },
  cantidad: {
    type: Number,
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
});

const Venta = mongoose.model('Venta', ventaSchema);

module.exports = Venta;