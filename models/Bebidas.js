const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bebidaSchema = new Schema({
  nombre: {
    type: String,
    required: true
  },
  categoria: {
    type: String,
    enum: ['copa', 'vino blanco', 'vino tinto', 'refresco', 'cerveza', 'cocktails'],  // Puedes agregar más categorías si las necesitas
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
  acompanante: {
    type: String,
    enum: ['refresco', 'agua tónica', 'soda', 'naranja', 'limón'],  // Opciones de acompañante si la categoría es "copa"
    required: function() {
      return this.categoria === 'copa';
    }
  },
  tipoDeVino: {
    type: String,
    enum: ['blanco', 'tinto'],  // Para los tipos de vino
    required: function() {
      return this.categoria === 'vino blanco' || this.categoria === 'vino tinto';
    }
  },
  precio: {
    type: Number,
    required: true
  },
  cantidad: {
    type: Number,
    required: true
  },
  imagen: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Bebida', bebidaSchema);
