const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const valoracionPlatoSchema = new mongoose.Schema({

    platoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plato',
        required: true
    },
    puntuacion: {
        type: Number, // Entre 1 y 5
        required: true,
    },
    comentario: {
        type: String,
        required: false,
    },
}, { timestamps: true });

const ValoracionPlato = mongoose.model('ValoracionPlato', valoracionPlatoSchema);
module.exports = ValoracionPlato;
