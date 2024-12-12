const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bebidaSchema = new Schema({
  nombre: {
    type: String,
    required: true
  },
  categoria: {
    type: String,
    enum: ['copa', 'vino blanco', 'vino tinto', 'refresco', 'cerveza', 'cocktails', 'ginebra', 'vodka', 'ron', 'whisky'],  // Puedes agregar más categorías si las necesitas
    required: true
  },
  descripcion: {
    type: String,
    required: true  // Descripción de la bebida
  },
  ingredientes: {
    type: [String],
    required: true  // Lista de ingredientes de la bebida
  },
  conHielo: {
    type: Boolean,
    default: false
  },
  conLimon: {
    type: Boolean,
    default: false
  },
  estadoPreparacion: {
    type: String,
    enum: ['pendiente', 'listo'],
    default: 'pendiente'
  },
  acompanante: {
    type: String,
    enum: ['refresco', 'agua tónica', 'soda', 'naranja', 'limón'],  // Opciones de acompañante si la categoría es "copa"
    required: function () {
      return this.categoria === 'copa';
    }
  },
  estado: {
    type: String,
    enum: ['habilitado', 'deshabilitado'],
    default: 'habilitado'
  },
  precio: {
    type: Number,
    required: true
  },
  precioCopa: { // Precio para la copa
    type: Number,
    required: true
  },
  precioBotella: { // Precio para la botella
    type: Number,
    required: true
  },
  tipoPedido: {  // Nuevo campo para decidir entre copa o botella
    type: String,
    enum: ['copa', 'botella'],
    required: true
  },
  cantidad: {
    type: Number
  },
  img: { type: String, required: true },
  ventas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Venta' }], // Ahora ventas es una referencia al modelo Venta

}, { timestamps: true });

module.exports = mongoose.model('Bebida', bebidaSchema);
