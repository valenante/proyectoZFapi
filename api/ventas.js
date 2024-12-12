const express = require('express');
const router = express.Router();
const PedidoBebida = require('../models/PedidoBebidas'); // Cambia la ruta según tu estructura
const Bebida = require('../models/Bebidas'); // Cambia la ruta según tu estructura
const Mesa = require('../models/Mesa'); // Cambia la ruta según tu estructura
const BebidaEliminada = require('../models/BebidaEliminada'); // Cambia la ruta según tu estructura
const Venta = require('../models/Ventas'); // Cambia la ruta según tu estructura+
const Plato = require('../models/Plato'); // Cambia la ruta según tu estructura

//Obtener todas las ventas 
router.get('/', async (req, res) => {
    try {
        const ventas = await Venta.find();
        res.json(ventas);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error al recuperar las ventas' });
    }
});

//Obtener una venta por id
router.get('/:id', async (req, res) => {
    try {
        const venta = await Ventas.findById(req.params.id);
        if (!venta) {
            return res.status(404).json({ mensaje: 'Venta no encontrada' });
        }
        res.json(venta);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error al recuperar la venta' });
    }
});

router.post('/ventas', async (req, res) => {
    try {
      const { platoId, pedidoId, cantidad } = req.body;

      console.log(platoId, pedidoId, cantidad);
  
      // Crear la venta
      const venta = new Venta({
        platoId,
        pedidoId,
        cantidad,
      });
  
      await venta.save();  // Guardar la venta
  
      // Asociar la venta al plato
      const plato = await Plato.findById(platoId);
      if (plato) {
        plato.ventas.push(venta._id);
        await plato.save();  // Guardar los cambios en el plato
      }
  
      res.status(201).json(venta);  // Retornar la venta creada
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al crear la venta' });
    }
  });

module.exports = router;