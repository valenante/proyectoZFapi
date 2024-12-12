const express = require('express');
const router = express.Router();
const ValoracionPlato = require('../models/ValoracionPlato');  // Importar el modelo de valoraciones
const Plato = require('../models/Plato');  // Importar el modelo de platos

router.post('/', async (req, res) => {
    try {
        console.log(req.body);
        const { valoraciones } = req.body;

        // Iterar sobre el array de valoraciones y guardarlas una por una
        for (let valoracion of valoraciones) {
            // Crear la nueva valoración
            const nuevaValoracion = new ValoracionPlato({
                platoId: valoracion.platoId,
                puntuacion: valoracion.puntuacion,
                comentario: valoracion.comentario,
            });

            // Guardar la valoración
            await nuevaValoracion.save();

            // Actualizar el plato para agregar la valoración
            await Plato.findByIdAndUpdate(valoracion.platoId, {
                $push: { valoraciones: nuevaValoracion._id }
            });
        }

        return res.status(200).json({ message: 'Valoraciones guardadas con éxito' });
    } catch (error) {
        console.error('Error al guardar la valoración:', error);
        return res.status(500).json({ message: 'Error al guardar la valoración' });
    }
});

router.get('/:platoId/valoraciones', async (req, res) => {
    try {
        const platoId = req.params.id;

        // Obtener el plato con las valoraciones
        const plato = await Plato.findById(platoId).populate('valoraciones');

        if (!plato) {
            return res.status(404).json({ message: 'Plato no encontrado' });
        }

        return res.status(200).json(plato.valoraciones);
    } catch (error) {
        console.error('Error al obtener las valoraciones:', error);
        return res.status(500).json({ message: 'Error al obtener las valoraciones' });
    }
});


module.exports = router;
