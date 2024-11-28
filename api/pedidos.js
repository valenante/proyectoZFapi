const express = require('express');
const router = express.Router();
const Pedido = require('../models/Pedido'); // Ajusta la ruta según tu estructura de archivos


module.exports = (io) => {
    // Crear un nuevo pedido
    router.post('/', async (req, res) => {
        try {
            const nuevoPedido = new Pedido(req.body);
            await nuevoPedido.save();

            // Emitir un evento con el nuevo pedido
            io.emit('nuevoPedido', nuevoPedido); // Enviar el pedido a todos los clientes conectados

            res.status(201).json({
                message: 'Pedido creado con éxito',
                pedidoId: nuevoPedido._id,
                pedido: nuevoPedido
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });


    // Obtener todos los pedidos
    router.get('/', async (req, res) => {
        try {
            const pedidos = await Pedido.find();
            res.status(200).json(pedidos);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    // Obtener pedidos por ID de mesa
    router.get('/mesa/:numeroMesa', async (req, res) => {
        try {
            // Obtener los pedidos de la mesa
            const pedidos = await Pedido.find({ mesa: req.params.numeroMesa });

            if (!pedidos.length) {
                return res.status(404).json({ error: 'No se encontraron pedidos para esta mesa' });
            }

            // Emitir un evento a través de Socket.IO para notificar a los clientes sobre los pedidos de la mesa
            io.emit('pedidos-mesa', { numeroMesa: req.params.numeroMesa, pedidos });

            // Devolver los pedidos al cliente
            res.status(200).json(pedidos);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Obtener un pedido por ID
    router.get('/:id', async (req, res) => {
        try {
            const pedido = await Pedido.findById(req.params.id);
            if (!pedido) {
                return res.status(404).json({ error: 'Pedido no encontrado' });
            }
            res.status(200).json(pedido);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Actualizar un pedido
    router.put('/:id', async (req, res) => {
        try {
            const pedidoActualizado = await Pedido.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!pedidoActualizado) {
                return res.status(404).json({ error: 'Pedido no encontrado' });
            }

            // Emitir el evento de estado actualizado
            io.emit('estadoPedidoActualizado', pedidoActualizado); // Enviar la actualización a todos los clientes

            res.status(200).json(pedidoActualizado);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });


    // Eliminar un pedido
    router.delete('/:id', async (req, res) => {
        try {
            const pedidoEliminado = await Pedido.findByIdAndDelete(req.params.id);
            if (!pedidoEliminado) {
                return res.status(404).json({ error: 'Pedido no encontrado' });
            }
            res.status(204).send(); // Sin contenido
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Obtener pedidos pendientes
    router.get('/pendientes', async (req, res) => {
        try {
            const pedidosPendientes = await Pedido.find({ estado: 'pendiente' });
            res.status(200).json(pedidosPendientes);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Obtener pedidos finalizados
    router.get('/finalizados', async (req, res) => {
        try {
            const pedidosFinalizados = await Pedido.find({ estado: 'finalizado' });
            res.status(200).json(pedidosFinalizados);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Agregar un plato a un pedido específico
    router.post('/:id/agregar-plato', async (req, res) => {
        const { platoId, nombre, cantidad, queso, acompanamiento, precios, especificaciones } = req.body; // Ajusta según los campos que necesitas
        try {
            const pedido = await Pedido.findById(req.params.id);
            if (!pedido) {
                return res.status(404).json({ error: 'Pedido no encontrado' });
            }

            // Agregar el nuevo plato al array de productos
            pedido.productos.push({ platoId, nombre, cantidad, queso, acompanamiento, precios, especificaciones });

            // Actualizar el total del pedido (puedes agregar tu lógica para calcular el total)
            pedido.total += precios.precio * cantidad; // Asegúrate de ajustar esto según tu modelo de precios

            await pedido.save();
            res.status(200).json(pedido);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

   // Eliminar un plato de un pedido específico
router.put('/:pedidoId/actualizar-plato/:platoId', async (req, res) => {
    console.log('Pedido ID:', req.params.pedidoId);
    console.log('Plato ID:', req.params.platoId);

    try {
        // Buscar el pedido por su ID
        const pedido = await Pedido.findById(req.params.pedidoId);

        if (!pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        // Buscar el plato a eliminar
        const platoEliminado = pedido.platos.find(plato =>
            plato._id.toString() === req.params.platoId
        );

        if (!platoEliminado) {
            return res.status(404).json({ error: 'Plato no encontrado en este pedido' });
        }

        // Actualizar el total del pedido
        pedido.total -= platoEliminado.precios[0] * platoEliminado.cantidad;

        // Filtrar el plato eliminado
        pedido.platos = pedido.platos.filter(plato =>
            plato._id.toString() !== req.params.platoId
        );

        // Guardar los cambios en la base de datos
        await pedido.save();

        // Emitir evento para actualizar el pedido en tiempo real
        io.emit('pedidoActualizado', pedido); // Notificar a los clientes conectados

        res.status(200).json(pedido);
    } catch (error) {
        console.error('Error eliminando plato:', error);
        res.status(400).json({ error: error.message });
    }
});


    router.put('/:id/completado', async (req, res) => {
        try {
            const pedido = await Pedido.findByIdAndUpdate(req.params.id, { estado: 'completado' }, { new: true });
            if (!pedido) {
                return res.status(404).json({ error: 'Pedido no encontrado' });
            }

            // Emitir evento para actualizar el estado del pedido
            io.emit('pedidoFinalizado', pedido); // Enviar el pedido finalizado a todos los clientes

            res.status(200).json(pedido);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    return router;
};