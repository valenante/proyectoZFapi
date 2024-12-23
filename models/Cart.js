const mongoose = require('mongoose');

// Definir un esquema para las opciones personalizables (si las tienes)
const opcionPersonalizableSchema = new mongoose.Schema({
  nombre: { type: String},
  opciones: [{ type: String}]
});
// Subesquema para los precios
const precioSchema = new mongoose.Schema({
    precio: { type: Number, default: null },
    racion: { type: Number, default: null },
    tapa: { type: Number, default: null }
});
// Definir el esquema para el carrito
const cartSchema = new mongoose.Schema(
  {
    // Referencia a la mesa asociada al carrito
    mesa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mesa', // Referencia al modelo Mesa
      required: true,
    },

    // Lista de platos en el carrito
    platos: [
      {
        nombre: { type: String, required: true },
        descripcion: { type: String, required: true },
        precios: { type: precioSchema, required: true },
        ingredientes: { type: [String], required: true },
        ingredientesEliminados: { type: [String], default: [] },
        opcionesPersonalizables: [opcionPersonalizableSchema],
        puntosDeCoccion: [{
          type: String, // Este solo tiene el nombre del punto de cocción, ej. "Poco hecho", "Bien hecho"
        }],
        especificaciones: { type: [String], default: [] },
        imagen: { type: String, required: true },
        categoria: {
          type: String,
          enum: ['especiales', 'carne', 'ensaladas', 'tapas', 'vegetarianos', 'mar', 'hamburguesas', 'postres'],
          required: true
        },
        estado: {
          type: String,
          enum: ['habilitado', 'deshabilitado'],
          default: 'habilitado'
        },
        estadoPreparacion: {
          type: String,
          enum: ['pendiente', 'listo'],
          default: 'pendiente'
        },
        tipoServicio: {
          type: String,
          enum: ['individual', 'compartir'],
          default: 'compartir',
          required: true
        },
        cantidad: { type: Number },
        tipo: { type: Array, required: true },
        ventas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Venta' }],
        createdAt: { type: Date, default: Date.now },

        // Nuevas propiedades para traducciones
        nombreEn: { type: String, default: '' },
        descripcionEn: { type: String, default: '' },
        nombreFr: { type: String, default: '' },
        descripcionFr: { type: String, default: '' },
        valoraciones: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ValoracionPlato' }]
      }
    ],

    // Lista de bebidas en el carrito
    bebidas: [
      {
        nombre: { type: String, required: true },
        categoria: {
          type: String,
          enum: ['copa', 'vino blanco', 'vino tinto', 'refresco', 'cerveza', 'cocktails', 'ginebra', 'vodka', 'ron', 'whisky'],
          required: true
        },
        descripcion: { type: String, required: true },
        ingredientes: { type: [String], required: true },
        conHielo: { type: Boolean, default: false },
        conLimon: { type: Boolean, default: false },
        estadoPreparacion: {
          type: String,
          enum: ['pendiente', 'listo'],
          default: 'pendiente'
        },
        acompanante: {
          type: String,
          enum: ['refresco', 'agua tónica', 'soda', 'naranja', 'limón'],
          required: function () {
            return this.categoria === 'copa';
          }
        },
        estado: {
          type: String,
          enum: ['habilitado', 'deshabilitado'],
          default: 'habilitado'
        },
        precio: { type: Number},
        precioCopa: { type: Number},
        precioBotella: { type: Number},
        tipoPedido: {
          type: String,
          enum: ['copa', 'botella'],
        },
        cantidad: { type: Number },
        img: { type: String},
        ventas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Venta' }]
      }
    ],

    // Total del carrito
    total: {
      type: Number,
      default: 0,
      set: function(value) {
        return parseFloat(value.toFixed(2)); // Redondeo del total
      }
    },

    // Estado del carrito
    estado: {
      type: String,
      enum: ['pendiente', 'enviado', 'cerrado'],
      default: 'pendiente',
    },

    // Comentarios adicionales
    comentario: {
      type: String,
      default: '',
    },
  },
  { timestamps: true } // Crear automáticamente campos 'createdAt' y 'updatedAt'
);

// Crear el modelo de carrito
const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
