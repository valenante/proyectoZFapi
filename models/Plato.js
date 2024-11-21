const mongoose = require('mongoose');

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
    opcionesPersonalizables: [opcionPersonalizableSchema],
    puntosDeCoccion: [{ 
        type: String, // Este solo tiene el nombre del punto de cocción, ej. "Poco hecho", "Bien hecho"
        required: true 
    }],    
    especificaciones: { type: [String], default: [] },
    imagen: { type: String, required: true },
    categoria: { 
        type: String, 
        enum: ['especiales', 'carne', 'ensaladas', 'tapas', 'vegetarianos','mar', 'hambuguesas', 'postres'], 
        required: true
    },
    estado: {
        type: String,
        enum: ['activo', 'inactivo'],
        default: 'activo'
    },
    createdAt: { type: Date, default: Date.now },

    // Nuevas propiedades para traducciones
    nombreEn: { type: String, default: '' },
    descripcionEn: { type: String, default: '' },
    nombreFr: { type: String, default: '' },
    descripcionFr: { type: String, default: '' }
});

module.exports = mongoose.model('Plato', platoSchema);
