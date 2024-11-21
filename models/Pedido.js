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
    ingredientes: {
        type: [String],
        default: []
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
    sabor: {
        type: Schema.Types.Mixed,  // Esto permite que el campo acepte tanto un string como un objeto
        required: false
    },
    opcionesPersonalizables: {
        type: Map,
        of: String,
        default: {}
    },
    puntosDeCoccion: {
        type: [String],
        default: []
    },
    especificaciones: {
        type: [String],
        default: []
    }
});

// Esquema principal de pedido (sin las bebidas)
const pedidoSchema = new mongoose.Schema({
    mesa: {
        type: Number,
        required: true
    },
    platos: [platoPedidoSchema],  // Lista de platos en el pedido
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
});

// Método para calcular el total del pedido
pedidoSchema.methods.calcularTotal = function() {
    this.total = this.platos.reduce((acc, plato) => {
        let precioUnitario;

        // Asignar el precio dependiendo del tipo de porción
        if (plato.tipoPorcion === 'tapa') {
            precioUnitario = plato.precios[0] || 0; // Precio de tapa
        } else if (plato.tipoPorcion === 'racion') {
            precioUnitario = plato.precios[1] || 0; // Precio de ración
        } else if (plato.tipoPorcion === 'surtido') {
            precioUnitario = plato.precios[2] || 0; // Precio de surtido
        } else {
            precioUnitario = plato.precios[0] || 0; // Precio por defecto
        }

        return acc + plato.cantidad * precioUnitario;
    }, 0);
};

module.exports = mongoose.model('Pedido', pedidoSchema);

