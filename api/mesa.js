const express = require('express');
const router = express.Router();
const Mesa = require('../models/Mesa'); // Ajusta la ruta según tu estructura de archivos

// Crear una nueva mesa
router.post('/', async (req, res) => {
    try {
        const nuevaMesa = new Mesa(req.body);
        await nuevaMesa.save();
        res.status(201).json(nuevaMesa);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Obtener todas las mesas
router.get('/', async (req, res) => {
    try {
        const mesas = await Mesa.find();
        res.status(200).json(mesas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener una mesa por ID
router.get('/:id', async (req, res) => {
    try {
        const mesa = await Mesa.findById(req.params.id);
        if (!mesa) {
            return res.status(404).json({ error: 'Mesa no encontrada' });
        }
        res.status(200).json(mesa);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:numero', async (req, res) => {
    try {
        // Validar el estado recibido (opcional)
        const { estado } = req.body;
        if (estado && !['abierta', 'cerrada'].includes(estado)) {
            return res.status(400).json({ error: 'Estado no válido. Use "abierta" o "cerrada".' });
        }

        // Buscar la mesa por el número
        const mesaActualizada = await Mesa.findOneAndUpdate(
            { numero: req.params.numero }, // Buscar por el campo 'numero'
            req.body, 
            { new: true } // Devuelve el documento actualizado
        );

        if (!mesaActualizada) {
            return res.status(404).json({ error: 'Mesa no encontrada' });
        }

        res.status(200).json(mesaActualizada);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});



// Eliminar una mesa
router.delete('/:id', async (req, res) => {
    try {
        const mesaEliminada = await Mesa.findByIdAndDelete(req.params.id);
        if (!mesaEliminada) {
            return res.status(404).json({ error: 'Mesa no encontrada' });
        }
        res.status(204).send(); // Sin contenido
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
