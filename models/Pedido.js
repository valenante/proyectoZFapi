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
    sabor: {
        type: Schema.Types.Mixed,  // Esto permite que el campo acepte tanto un string como un objeto
        required: false
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
    }
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
        type: Number,
        required: true
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

    // Agregar el total de las bebidas al total del pedido
    this.total += this.bebidas.reduce((acc, bebida) => {
        return acc + bebida.cantidad * bebida.precio;
    }, 0);
};

module.exports = mongoose.model('Pedido', pedidoSchema);
