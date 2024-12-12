const express = require('express');
const router = express.Router();
const Bebida = require('../models/Bebidas'); // Ajusta la ruta según tu estructura de archivos
const multer = require('multer');
const path = require('path');
const Venta = require('../models/Ventas');
const bebidaEliminada = require('../models/BebidaEliminada');

// Obtener bebidas eliminadas
router.get('/', async (req, res) => {
    try {
        const bebidasEliminadas = await bebidaEliminada.find()
            .populate('userId', 'username') // Obtener solo el campo 'username' del User
            .populate('mesaId', 'numero') // Obtener solo el campo 'numero' de la Mesa
            .populate('bebidaId', 'nombre descripcion') // Obtener nombre y descripción del plato
            .populate('pedidoId', 'numero comensales') // Obtener número y comensales del pedido
            .exec();

        res.status(200).json(bebidasEliminadas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
