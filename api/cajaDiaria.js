const express = require('express');
const router = express.Router();
const CajaDiaria = require('../models/CajaDiaria');

// Obtener todas las cajas diarias
router.get('/', async (req, res) => {
    try {
        const cajas = await CajaDiaria.find().sort({ fecha: 1 }); // Ordenar por fecha ascendente
        res.status(200).json(cajas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/crear', async (req, res) => {
    try {
        const { fecha, total } = req.body;

        console.log(fecha, total);  

        if (!total) {
            return res.status(400).json({ error: 'El campo `total` es obligatorio.' });
        }

        const caja = new CajaDiaria({
            fecha: fecha || new Date().toISOString(),
            total,
        });

        await caja.save();
        res.status(201).json(caja);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;
