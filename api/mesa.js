const express = require('express');
const router = express.Router();
const Mesa = require('../models/Mesa'); // Ajusta la ruta según tu estructura de archivos
const Pedido = require('../models/Pedido'); // Ajusta la ruta según tu estructura de archivos
const PedidoBebidas = require('../models/PedidoBebidas'); // Ajusta la ruta según tu estructura de archivos
const MesaEliminada = require('../models/MesaEliminada'); // Ajusta la ruta según tu estructura de archivos

module.exports = (io) => {

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

    router.put('/:mesa', async (req, res) => {
        try {
            const mesaActualizada = await Mesa.findOneAndUpdate(
                { numero: req.params.mesa }, // Buscar por el número de mesa
                { estado: 'abierta' }, // Forzar el valor de estado a 'abierta'
                { new: true } // Retornar el documento actualizado
            );

            if (!mesaActualizada) {
                return res.status(404).json({ error: 'Mesa no encontrada' });
            }

            // Emitir un evento a través de Socket.IO para notificar que la mesa ha sido actualizada
            io.emit('mesa-actualizada', mesaActualizada); // Enviamos la mesa actualizada a todos los clientes conectados

            res.status(200).json(mesaActualizada);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });


    router.put('/cerrar/:mesa', async (req, res) => {
        try {
            // Buscar la mesa que se va a cerrar
            const mesa = await Mesa.findOne({ numero: req.params.mesa });
            
            if (!mesa) {
                return res.status(404).json({ error: 'Mesa no encontrada' });
            }
    
            // Buscar los pedidos asociados a la mesa
            const pedidosAsociados = await Pedido.find({ mesa: req.params.mesa });
            
            // Crear la mesa eliminada sin el campo 'estado' y otros innecesarios
            const mesaEliminada = new MesaEliminada({
                numeroMesa: mesa.numero,      // Número de la mesa
                detallesMesa: mesa,           // Detalles de la mesa
                pedidosAsociados: pedidosAsociados, // Recuperar los pedidos asociados
                numero: mesa.numero           // Asegúrate de incluir el número
            });
    
            // Guardar la mesa eliminada
            await mesaEliminada.save();
    
            // Actualizar el estado de la mesa original a 'cerrada'
            const mesaActualizada = await Mesa.findOneAndUpdate(
                { numero: req.params.mesa },
                { estado: 'cerrada' },  // Solo actualizas el estado a 'cerrada'
                { new: true } // Esto te devolverá el objeto actualizado
            );
    
            if (!mesaActualizada) {
                return res.status(404).json({ error: 'Mesa no encontrada' });
            }
    
            // Eliminar los pedidos y bebidas asociados a la mesa
            const pedidosEliminados = await Pedido.deleteMany({ mesa: req.params.mesa });
            const bebidasEliminadas = await PedidoBebidas.deleteMany({ mesa: req.params.mesa });
    
            // Emitir evento para notificar que la mesa ha sido cerrada
            io.emit('mesa-cerrada', { mesa: mesaActualizada, pedidosEliminados, bebidasEliminadas });
    
            res.status(200).json({
                mesa: mesaActualizada,
                mensaje: 'Mesa cerrada y pedidos eliminados con éxito.',
            });
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

    return router;

};