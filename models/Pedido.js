const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Esquema para los platos dentro de un pedido
const platoPedidoSchema = new mongoose.Schema({
    platoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plato',
        required: true
    },
    cantidad: {
        type: Number,
        required: true,
        default: 1
    },
    nombre: {
        type: String,
        required: true
    },
    descripcion: {
        type: String,
        required: false
    },
    precios: {
        type: [Number],
        required: true
    },
    tipoPorcion: {
        type: String,
        enum: ['tapa', 'racion', 'surtido'],
        required: false
    },
    estadoPreparacion: {
        type: String,
        enum: ['pendiente', 'listo'],
        default: 'pendiente'
    },
    sabor: {
        type: Schema.Types.Mixed,  // Esto permite que el campo acepte tanto un string como un objeto
        required: false
    },
    tipoServicio: {
        type: String,
        enum: ['individual', 'compartir'],
        required: true
    },
    ingredientes: {
        type: [String],
        default: []
    },
    ingredientesEliminados: {
        type: [String],
        default: []
    },
    opcionesPersonalizadas: {
        type: Map,
        of: String,
        default: {}
    },
    croquetas: {
        type: Array,
        default: []
    },
    tipo: {
        type: String,
    },
    puntosDeCoccion: {
        type: [String],
        default: []
    },
    especificaciones: {
        type: [String],
        default: []
    },
    ventas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Venta' }], // Ahora ventas es una referencia al modelo Venta
        
});

// Esquema para las bebidas dentro de un pedido
const bebidaPedidoSchema = new mongoose.Schema({
    bebidaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bebida', // Asegúrate de que 'Bebida' esté definido correctamente en el modelo de bebidas
        required: true
    },
    cantidad: {
        type: Number,
        required: true,
        default: 1
    },
    nombre: {
        type: String,
        required: true
    },
    categoria: {
        type: String,
        required: true
    },
    precio: {
        type: Number,
        required: true
    },
    conHielo: {
        type: Boolean,
        default: false
    },
    conLimon: {
        type: Boolean,
        default: false
    },
    acompañante: {
        type: String,
    },
    tipoDeVino: {
        type: String,
        enum: ['blanco', 'tinto'],
        required: function() {
            return this.categoria === 'vino blanco' || this.categoria === 'vino tinto';
        }
    },
    opcionesPersonalizadas: {
        type: Map,
        of: String,
        default: {}
    }
});

// Esquema principal de pedido
const pedidoSchema = new mongoose.Schema({
    mesa: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Mesa',  // Relacionado con el modelo 'Mesa'
        required: true
    },
    mesaDia: {
        type: Number, 
        ref: 'Mesa',  // Relacionado con el modelo 'Mesa'
        required: false
    },
    platos: [platoPedidoSchema],  // Lista de platos en el pedido
    bebidas: [bebidaPedidoSchema], // Lista de bebidas en el pedido
    total: {
        type: Number,
        required: true,
        default: 0
    },
    mensaje: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    alergias: {
        type: [String],
        default: []
    },
    comensales: {
        type: String,
        required: false
    },
    estado: {
        type: String,
        enum: ['pendiente', 'en proceso', 'completado', 'cancelado'],
        default: 'pendiente'
    }
});

const Pedido = mongoose.model('Pedido', pedidoSchema);
module.exports = Pedido;
