const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RegistroVentasSchema = new mongoose.Schema({
    itemId: { type: mongoose.Schema.Types.ObjectId }, // o Bebida
    cantidad: Number,
    fecha: { type: Date, default: Date.now }, // Fecha de la venta
});

module.exports = mongoose.model('RegistroVentas', RegistroVentasSchema);