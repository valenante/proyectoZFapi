const express = require('express');
const router = express.Router();
const PlatoEliminado = require('../models/PlatoEliminado');

router.get('/', async (req, res) => {
    try {
        const platosEliminados = await PlatoEliminado.find()
            .populate('userId', 'username') // Obtener solo el campo 'username' del User
            .populate('mesaId', 'numero') // Obtener solo el campo 'numero' de la Mesa
            .populate('platoId', 'nombre descripcion') // Obtener nombre y descripción del plato
            .populate('pedidoId', 'numero comensales') // Obtener número y comensales del pedido
            .exec();

        res.status(200).json(platosEliminados);
    } catch (error) {
        console.error('Error al obtener los platos eliminados:', error);
        res.status(500).json({ error: 'Error al obtener los platos eliminados' });
    }
});

module.exports = router;
