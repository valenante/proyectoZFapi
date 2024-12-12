const mongoose = require('mongoose');

const cajaDiariaSchema = new mongoose.Schema({
    fecha: {
        type: Date,
        required: true,
        unique: true, // Solo una entrada por día
    },
    total: {
        type: Number,
        required: true,
    },
    detalle: {
        type: [String], // Opcional: puedes guardar detalles, como IDs de ventas o comentarios
        default: []
    }
});

const CajaDiaria = mongoose.model('CajaDiaria', cajaDiariaSchema);

module.exports = CajaDiaria;
