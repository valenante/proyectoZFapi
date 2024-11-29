const express = require('express');
const router = express.Router();
const PedidoBebida = require('../models/PedidoBebidas'); // Cambia la ruta según tu estructura
const Bebida = require('../models/Bebidas'); // Cambia la ruta según tu estructura
const Mesa = require('../models/Mesa'); // Cambia la ruta según tu estructura
const BebidaEliminada = require('../models/BebidaEliminada'); // Cambia la ruta según tu estructura

module.exports = (io) => {
    // Crear un nuevo pedido de bebida
    router.post('/', async (req, res) => {
        try {
            // Asumimos que el ID de la mesa está en el cuerpo de la solicitud
            const { mesa, ...pedidoData } = req.body;

            // Buscar la mesa usando el ObjectId de la mesa
            const mesaExistente = await Mesa.findById(mesa); // Buscamos por ObjectId (ID de la mesa)

            if (!mesaExistente) {
                return res.status(404).json({ error: 'Mesa no encontrada' });
            }

            // Crear el nuevo pedido de bebida con el ObjectId de la mesa
            const nuevoPedidoBebida = new PedidoBebida({
                ...pedidoData, // Mantener los datos del pedido de bebida
                mesa: mesaExistente._id, // Asignar el ObjectId de la mesa
            });

            // Guardar el nuevo pedido de bebida en la base de datos
            await nuevoPedidoBebida.save();

            // Agregar el ID del nuevo pedido al campo 'pedidoBebidas' de la mesa
            if (!mesaExistente.pedidoBebidas) {
                mesaExistente.pedidoBebidas = []; // Inicializar si no existe
            }

            mesaExistente.pedidoBebidas.push(nuevoPedidoBebida._id);

            // **Sumar el total del nuevo pedido de bebida al total de la mesa**
            mesaExistente.total += nuevoPedidoBebida.total; // Supone que 'total' es una propiedad del modelo PedidoBebida

            // Guardar la mesa actualizada
            await mesaExistente.save();

            // Emitir un evento con el nuevo pedido de bebida para los clientes conectados
            io.emit('nuevoPedidoBebida', nuevoPedidoBebida);

            res.status(201).json({
                message: 'Pedido de bebida creado con éxito',
                pedidoId: nuevoPedidoBebida._id,
                pedido: nuevoPedidoBebida,
            });
        } catch (error) {
            console.error(error);
            res.status(400).json({ error: error.message });
        }
    });



    // Obtener todos los pedidos de bebidas
    router.get('/', async (req, res) => {
        try {
            const pedidosBebida = await PedidoBebida.find();
            res.status(200).json(pedidosBebida);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Obtener pedidos de bebida por número de mesa
    router.get('/mesa/:numeroMesa', async (req, res) => {
        try {
            // Obtener los pedidos de bebida de la mesa
            const pedidosBebida = await PedidoBebida.find({ mesa: req.params.numeroMesa });

            if (!pedidosBebida.length) {
                return res.status(404).json({ error: 'No se encontraron pedidos de bebida para esta mesa' });
            }

            // Emitir un evento a través de Socket.IO para notificar a los clientes sobre los pedidos de bebida de la mesa
            io.emit('pedidos-bebida-mesa', { numeroMesa: req.params.numeroMesa, pedidosBebida });

            // Devolver los pedidos de bebida al cliente
            res.status(200).json(pedidosBebida);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Obtener un pedido de bebida por ID
    router.get('/:id', async (req, res) => {
        try {
            const pedidoBebida = await PedidoBebida.findById(req.params.id);
            if (!pedidoBebida) {
                return res.status(404).json({ error: 'Pedido de bebida no encontrado' });
            }
            res.status(200).json(pedidoBebida);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Actualizar un pedido de bebida
    router.put('/:id', async (req, res) => {
        try {
            const pedidoBebidaActualizado = await PedidoBebida.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!pedidoBebidaActualizado) {
                return res.status(404).json({ error: 'Pedido de bebida no encontrado' });
            }
            res.status(200).json(pedidoBebidaActualizado);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // Eliminar un pedido de bebida
    router.delete('/:id', async (req, res) => {
        try {
            const pedidoBebidaEliminado = await PedidoBebida.findByIdAndDelete(req.params.id);
            if (!pedidoBebidaEliminado) {
                return res.status(404).json({ error: 'Pedido de bebida no encontrado' });
            }
            res.status(204).send(); // Sin contenido
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Obtener pedidos de bebidas pendientes
    router.get('/pendientes', async (req, res) => {
        try {
            const pedidosBebidaPendientes = await PedidoBebida.find({ estado: 'pendiente' });
            res.status(200).json(pedidosBebidaPendientes);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Obtener pedidos de bebidas finalizados
    router.get('/finalizados', async (req, res) => {
        try {
            const pedidosBebidaFinalizados = await PedidoBebida.find({ estado: 'finalizado' });
            res.status(200).json(pedidosBebidaFinalizados);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Agregar una bebida a un pedido de bebida específico
    router.post('/:id/agregar-bebida', async (req, res) => {
        const { bebidaId, nombre, cantidad, precios, especificaciones } = req.body; // Ajusta según los campos que necesitas
        try {
            const pedidoBebida = await PedidoBebida.findById(req.params.id);
            if (!pedidoBebida) {
                return res.status(404).json({ error: 'Pedido de bebida no encontrado' });
            }

            // Agregar la nueva bebida al array de bebidas
            pedidoBebida.bebidas.push({ bebidaId, nombre, cantidad, precios, especificaciones });

            // Actualizar el total del pedido de bebida (puedes agregar tu lógica para calcular el total)
            pedidoBebida.total += precios.precio * cantidad; // Asegúrate de ajustar esto según tu modelo de precios

            await pedidoBebida.save();
            res.status(200).json(pedidoBebida);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    router.delete('/:pedidoId/eliminar-bebida/:bebidaId', async (req, res) => {
        const { pedidoId, bebidaId } = req.params;

        try {
            // Buscar el pedido de bebida por su ID
            const pedidoBebida = await PedidoBebida.findById(pedidoId);

            // Verificar si el pedido de bebida existe
            if (!pedidoBebida) {
                return res.status(404).json({ error: 'Pedido de bebida no encontrado' });
            }

            // Verificar que el pedido contiene bebidas
            if (!pedidoBebida.bebidas || pedidoBebida.bebidas.length === 0) {
                return res.status(400).json({ error: 'El pedido no tiene bebidas' });
            }

            // Buscar la bebida que se quiere eliminar usando el _id de la bebida
            const bebidaEliminada = pedidoBebida.bebidas.find(bebida =>
                bebida._id.toString() === bebidaId // Comparar `_id` directamente
            );

            // Verificar si la bebida existe en el pedido
            if (!bebidaEliminada) {
                return res.status(400).json({ error: 'Bebida no encontrada en el pedido' });
            }

            // Calcular el nuevo total del pedido, restando el precio de la bebida eliminada
            pedidoBebida.total -= bebidaEliminada.precio * bebidaEliminada.cantidad;

            // Filtrar la bebida eliminada
            pedidoBebida.bebidas = pedidoBebida.bebidas.filter(bebida =>
                bebida._id.toString() !== bebidaId
            );

            // Guardar los cambios en el pedido de bebida
            await pedidoBebida.save();

            // Devolver la respuesta con el pedido de bebida actualizado
            res.status(200).json(pedidoBebida);
        } catch (error) {
            console.error(error);
            res.status(400).json({ error: error.message });
        }
    });
    router.put('/:pedidoId/actualizar-bebida/:bebidaId', async (req, res) => {
        try {
            // Buscar el pedido por su ID
            const pedido = await PedidoBebida.findById(req.params.pedidoId);
    
            if (!pedido) {
                return res.status(404).json({ error: 'Pedido no encontrado' });
            }
    
            // Buscar la bebida a eliminar
            const bebidaEliminada = pedido.bebidas.find(bebida =>
                bebida._id.toString() === req.params.bebidaId
            );
    
            if (!bebidaEliminada) {
                return res.status(404).json({ error: 'Bebida no encontrada en este pedido' });
            }
    
            // Registrar la eliminación en la colección BebidaEliminada
            const bebidaEliminadaRegistrada = new BebidaEliminada({
                mesaId: pedido.mesa,
                bebidaId: bebidaEliminada._id,
                pedidoId: pedido._id,
                cantidad: bebidaEliminada.cantidad,
                motivoEliminacion: 'Eliminado por el usuario', // O el motivo que prefieras
            });
    
            await bebidaEliminadaRegistrada.save();  // Guardar la bebida eliminada en la base de datos
    
            // Actualizar el total del pedido
            const totalBebidaEliminada = bebidaEliminada.precio * bebidaEliminada.cantidad;
            pedido.total -= totalBebidaEliminada;
    
            // Filtrar la bebida eliminada
            pedido.bebidas = pedido.bebidas.filter(bebida =>
                bebida._id.toString() !== req.params.bebidaId
            );
    
            // Si no quedan bebidas en el pedido, eliminar todo el pedido
            if (pedido.bebidas.length === 0) {
                // Eliminar el pedido completo
                await PedidoBebida.findByIdAndDelete(pedido._id);
    
                // Buscar la mesa asociada al pedido de bebidas
                const mesa = await Mesa.findOne({ 'pedidoBebidas': pedido._id });
    
                if (mesa) {
                    // Eliminar la referencia al pedido de bebidas de la mesa
                    mesa.pedidoBebidas = mesa.pedidoBebidas.filter(pedidoBebidaId =>
                        pedidoBebidaId.toString() !== pedido._id.toString()
                    );
    
                    // Actualizar el total de la mesa restando el total de la bebida eliminada
                    mesa.total -= totalBebidaEliminada;
    
                    // Guardar la mesa actualizada
                    await mesa.save();
    
                    // Emitir evento para notificar a los clientes sobre la eliminación de la mesa
                    io.emit('mesaEliminada', mesa);  // Notificar en tiempo real
                }
    
                // Emitir evento para notificar que el pedido ha sido eliminado
                io.emit('pedidoEliminado', pedido);  // Notificar en tiempo real
                return res.status(200).json({ message: 'Pedido eliminado porque no tiene bebidas' });
            }
    
            // Guardar los cambios en el pedido si no está vacío
            await pedido.save();
    
            // Buscar la mesa asociada al pedido de bebidas
            const mesa = await Mesa.findOne({ 'pedidoBebidas': pedido._id });
    
            if (mesa) {
                // Actualizar el total de la mesa restando el total de la bebida eliminada
                mesa.total -= totalBebidaEliminada;
    
                // Guardar la mesa actualizada
                await mesa.save();
    
                // Emitir evento para notificar a los clientes sobre la actualización de la mesa
                io.emit('mesaActualizada', mesa);  // Notificar en tiempo real
            }
    
            // Emitir evento para actualizar el pedido en tiempo real
            io.emit('pedidoActualizado', pedido);  // Notificar a los clientes conectados
    
            res.status(200).json(pedido);
        } catch (error) {
            console.error('Error eliminando bebida:', error);
            res.status(400).json({ error: error.message });
        }
    });

    return router;
};
