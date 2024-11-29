const mongoose = require('mongoose');
const Schema = mongoose.Schema;  // Esta constante se puede usar en lugar de 'mongoose.Schema'

// Esquema para las bebidas dentro de un pedido
const bebidaPedidoSchema = new Schema({
    bebidaId: {
        type: Schema.Types.ObjectId,
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

// Esquema principal de pedido para las bebidas
const pedidoBebidasSchema = new Schema({
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
    estado: {
        type: String,
        enum: ['pendiente', 'en proceso', 'completado', 'cancelado'],
        default: 'pendiente'
    }
}, { collection: 'pedidoBebidas' }); // Aquí especificamos que el modelo usará la colección 'pedidoBebidas'

// Método para calcular el total del pedido de bebidas
pedidoBebidasSchema.methods.calcularTotal = function() {
    this.total = this.bebidas.reduce((acc, bebida) => {
        return acc + bebida.cantidad * bebida.precio;
    }, 0);
};

module.exports = mongoose.model('PedidoBebidas', pedidoBebidasSchema);
