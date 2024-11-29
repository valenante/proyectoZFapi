const express = require('express');
const router = express.Router();
const Pedido = require('../models/Pedido'); // Ajusta la ruta según tu estructura de archivos
const Mesa = require('../models/Mesa'); // Ajusta la ruta según tu estructura de archivos
const PlatoEliminado = require('../models/PlatoEliminado'); // Ajusta la ruta según tu estructura de archivos

module.exports = (io) => {
   // Crear un nuevo pedido
   router.post('/', async (req, res) => {
    console.log(req.body);
    try {
        // Asumimos que el id de la mesa está en el cuerpo de la solicitud
        const { mesa, ...pedidoData } = req.body;

        // Buscar la mesa usando el ObjectId de la mesa
        const mesaExistente = await Mesa.findById(mesa);  // Buscamos por ObjectId (ID de la mesa)

        if (!mesaExistente) {
            return res.status(404).json({ error: 'Mesa no encontrada' });
        }

        // Crear el nuevo pedido con el ObjectId de la mesa
        const nuevoPedido = new Pedido({
            ...pedidoData,  // Mantener los datos del pedido
            mesa: mesaExistente._id  // Asignar el ObjectId de la mesa
        });

        // Guardar el nuevo pedido en la base de datos
        await nuevoPedido.save();

        // Agregar el ID del nuevo pedido al campo 'pedidos' de la mesa
        mesaExistente.pedidos.push(nuevoPedido._id);

        // **Sumar el total del nuevo pedido al total de la mesa**
        mesaExistente.total += nuevoPedido.total; // Supone que 'total' es una propiedad del modelo Pedido

        // Guardar la mesa actualizada
        await mesaExistente.save();

        // Emitir un evento con el nuevo pedido para los clientes conectados
        io.emit('nuevoPedido', nuevoPedido);

        res.status(201).json({
            message: 'Pedido creado con éxito',
            pedidoId: nuevoPedido._id,
            pedido: nuevoPedido
        });
    } catch (error) {
        console.error(error);
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
router.get('/mesa/:id', async (req, res) => {
    try {
        // Obtener los pedidos de la mesa usando el ID de la mesa
        const pedidos = await Pedido.find({ mesa: req.params.id });

        if (!pedidos.length) {
            return res.status(404).json({ error: 'No se encontraron pedidos para esta mesa' });
        }

        // Emitir un evento a través de Socket.IO para notificar a los clientes sobre los pedidos de la mesa
        io.emit('pedidos-mesa', { idMesa: req.params.id, pedidos });

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
    
            // Registrar la eliminación en la colección PlatoEliminado
            const platoEliminadoRegistrado = new PlatoEliminado({
                mesaId: pedido.mesa,
                platoId: platoEliminado._id,
                pedidoId: pedido._id,
                cantidad: platoEliminado.cantidad,
                motivoEliminacion: 'Eliminado por el usuario', // O el motivo que prefieras
            });
    
            await platoEliminadoRegistrado.save();  // Guardar el plato eliminado en la base de datos
    
            // Actualizar el total del pedido
            const totalPlatoEliminado = platoEliminado.precios[0] * platoEliminado.cantidad;
            pedido.total -= totalPlatoEliminado;
    
            // Filtrar el plato eliminado
            pedido.platos = pedido.platos.filter(plato =>
                plato._id.toString() !== req.params.platoId
            );
    
            // Si no quedan platos en el pedido, eliminar todo el pedido
            if (pedido.platos.length === 0) {
                // Eliminar el pedido completo
                await Pedido.findByIdAndDelete(pedido._id);
    
                // Buscar la mesa asociada al pedido
                const mesa = await Mesa.findOne({ 'pedidos': pedido._id });
    
                if (mesa) {
                    // Eliminar la referencia al pedido de la mesa
                    mesa.pedidos = mesa.pedidos.filter(pedidoId =>
                        pedidoId.toString() !== pedido._id.toString()
                    );
    
                    // Actualizar el total de la mesa restando el total del plato eliminado
                    mesa.total -= totalPlatoEliminado;
    
                    // Guardar la mesa actualizada
                    await mesa.save();
    
                    // Emitir evento para notificar a los clientes sobre la eliminación de la mesa
                    io.emit('mesaEliminada', mesa);  // Notificar en tiempo real
                }
    
                // Emitir evento para notificar que el pedido ha sido eliminado
                io.emit('pedidoEliminado', pedido);  // Notificar en tiempo real
                return res.status(200).json({ message: 'Pedido eliminado porque no tiene platos' });
            }
    
            // Guardar los cambios en el pedido si no está vacío
            await pedido.save();
    
            // Buscar la mesa asociada al pedido
            const mesa = await Mesa.findOne({ 'pedidos': pedido._id });
    
            if (mesa) {
                // Actualizar el total de la mesa restando el total del plato eliminado
                mesa.total -= totalPlatoEliminado;
    
                // Guardar la mesa actualizada
                await mesa.save();
    
                // Emitir evento para notificar a los clientes sobre la actualización de la mesa
                io.emit('mesaActualizada', mesa);  // Notificar en tiempo real
            }
    
            // Emitir evento para actualizar el pedido en tiempo real
            io.emit('pedidoActualizado', pedido);  // Notificar a los clientes conectados
    
            res.status(200).json(pedido);
        } catch (error) {
            console.error('Error eliminando plato:', error);
            res.status(400).json({ error: error.message });
        }
    });
    

router.put('/:pedidoId/plato/:platoId/listo', async (req, res) => {
    try {
        const pedido = await Pedido.findById(req.params.pedidoId);
        if (!pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        // Buscar el plato por su ID
        const plato = pedido.platos.find(plato =>
            plato._id.toString() === req.params.platoId
        );

        if (!plato) {
            return res.status(404).json({ error: 'Plato no encontrado en este pedido' });
        }

        // Alternar entre los estados 'listo' y 'pendiente'
        plato.estadoPreparacion = plato.estadoPreparacion === 'listo' ? 'pendiente' : 'listo';

        // Guardar los cambios en la base de datos
        await pedido.save();

        // Emitir evento para actualizar el pedido en tiempo real
        io.emit('pedidoActualizado', pedido); // Notificar a los clientes conectados

        res.status(200).json(pedido);
    } catch (error) {
        console.error('Error actualizando estado de preparación:', error);
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