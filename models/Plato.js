const mongoose = require('mongoose');
const { param } = require('../api/auth');

// Subesquema para los precios
const precioSchema = new mongoose.Schema({
    precio: { type: Number, default: null },
    racion: { type: Number, default: null },
    tapa: { type: Number, default: null }
});

// Subesquema para las opciones personalizables
const opcionPersonalizableSchema = new mongoose.Schema({
    tipo: {
        type: String,
        required: true
    },
    opciones: {
        type: [String], // Ejemplo: ["cheddar", "mozzarella"] para queso, ["patatas", "ensalada"] para acompañamiento
        default: [] // Un arreglo vacío por defecto
    }
});

// Esquema principal de plato
const platoSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    precios: { type: precioSchema, required: true },
    ingredientes: { type: [String], required: true },
    ingredientesEliminados: { type: [String], default: [] },
    opcionesPersonalizables: [opcionPersonalizableSchema],
    puntosDeCoccion: [{ 
        type: String, // Este solo tiene el nombre del punto de cocción, ej. "Poco hecho", "Bien hecho"
        required: true 
    }],    
    especificaciones: { type: [String], default: [] },
    imagen: { type: String, required: true },
    categoria: { 
        type: String, 
        enum: ['especiales', 'carne', 'ensaladas', 'tapas', 'vegetarianos','mar', 'hamburguesas', 'postres'], 
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
        enum: ['invidivual', 'compartir'],
        default: 'compartir',
        required: true
    },
    tipo: {
        type: Array,
        required: true
    },
    ventas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Venta' }], // Ahora ventas es una referencia al modelo Venta
    createdAt: { type: Date, default: Date.now },

    // Nuevas propiedades para traducciones
    nombreEn: { type: String, default: '' },
    descripcionEn: { type: String, default: '' },
    nombreFr: { type: String, default: '' },
    descripcionFr: { type: String, default: '' },
    valoraciones: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ValoracionPlato' }]
});

const Plato = mongoose.model('Plato', platoSchema);
module.exports = Plato;

