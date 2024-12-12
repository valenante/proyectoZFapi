const express = require('express');
const router = express.Router();
const PedidoBebida = require('../models/PedidoBebidas'); // Cambia la ruta según tu estructura
const Bebida = require('../models/Bebidas'); // Cambia la ruta según tu estructura
const Mesa = require('../models/Mesa'); // Cambia la ruta según tu estructura
const BebidaEliminada = require('../models/BebidaEliminada'); // Cambia la ruta según tu estructura
const Venta = require('../models/Ventas'); // Cambia la ruta según tu estructura
const authenticateToken = require('../middlewares/authenticateToken'); // Ajusta la ruta según tu estructura de archivos

module.exports = (io) => {
    // Crear un nuevo pedido de bebida
    router.post('/', async (req, res) => {
        try {
            console.log('Cuerpo de la solicitud:', req.body);
    
            const { mesa, bebidas, total, ...pedidoData } = req.body;
    
            console.log('Buscando mesa con ID:', mesa);
            const mesaExistente = await Mesa.findById(mesa);
    
            if (!mesaExistente) {
                console.error('Mesa no encontrada');
                return res.status(404).json({ error: 'Mesa no encontrada' });
            }
    
            console.log('Mesa encontrada:', mesaExistente);
    
            // Crear el nuevo pedido de bebida con el ObjectId de la mesa
            const nuevoPedidoBebida = new PedidoBebida({
                bebidas,
                total,
                ...pedidoData,
                mesa: mesaExistente._id,
            });
    
            console.log('Nuevo pedido de bebidas a guardar:', nuevoPedidoBebida);
    
            // Guardar el nuevo pedido de bebida en la base de datos
            await nuevoPedidoBebida.save();
            console.log('Pedido de bebidas guardado con éxito:', nuevoPedidoBebida);
    
            // Asociar el pedido a la mesa
            mesaExistente.pedidoBebidas.push(nuevoPedidoBebida._id);
            mesaExistente.total += nuevoPedidoBebida.total;
            mesaExistente.total = parseFloat(mesaExistente.total.toFixed(2));

    
            // Guardar la mesa actualizada
            await mesaExistente.save();
            console.log('Mesa actualizada:', mesaExistente);
    
            // Crear ventas para cada bebida del pedido
            for (const bebida of bebidas) {
                console.log('Procesando bebida:', bebida);
    
                const venta = new Venta({
                    bebidaId: bebida.bebidaId,
                    pedidoId: nuevoPedidoBebida._id,
                    cantidad: bebida.cantidad,
                });
    
                console.log('Venta a guardar:', venta);
    
                // Guardar la venta en la base de datos
                await venta.save();
                console.log('Venta guardada con éxito:', venta);
    
                // Buscar la bebida en el pedido
                const bebidaEnPedido = nuevoPedidoBebida.bebidas.find(
                    (b) => b.bebidaId.toString() === bebida.bebidaId.toString()
                );
    
                if (bebidaEnPedido) {
                    // Asociar la venta al campo ventas dentro de la bebida
                    bebidaEnPedido.ventas = bebidaEnPedido.ventas || [];
                    bebidaEnPedido.ventas.push(venta._id);
                    console.log('Venta asociada a la bebida dentro del pedido:', bebidaEnPedido);
                } else {
                    console.error('Bebida no encontrada dentro del pedido:', bebida.bebidaId);
                }
            }
    
            // Guardar el pedido actualizado
            await nuevoPedidoBebida.save();
            console.log('Pedido de bebidas actualizado con ventas asociadas:', nuevoPedidoBebida);
    
            // Emitir un evento con el nuevo pedido de bebida
            io.emit('nuevoPedidoBebida', nuevoPedidoBebida);
    
            res.status(201).json({
                message: 'Pedido de bebida creado con éxito',
                pedidoId: nuevoPedidoBebida._id,
                pedido: nuevoPedidoBebida,
            });
        } catch (error) {
            console.error('Error al procesar el pedido de bebidas:', error);
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

    router.put('/:pedidoId/bebida/:bebidaId/listo', async (req, res) => {
        try {
            const pedidoBebida = await PedidoBebida.findById(req.params.pedidoId);
            if (!pedidoBebida) {
                return res.status(404).json({ error: 'Pedido no encontrado' });
            }

            // Buscar la bebida por su ID
            const bebida = pedidoBebida.bebidas.find(bebida =>
                bebida._id.toString() === req.params.bebidaId
            );

            if (!bebida) {
                return res.status(404).json({ error: 'Bebida no encontrada en este pedido' });
            }

            // Alternar entre los estados 'listo' y 'pendiente'
            bebida.estadoPreparacion = bebida.estadoPreparacion === 'listo' ? 'pendiente' : 'listo';

            // Guardar los cambios en la base de datos
            await pedidoBebida.save();

            // Emitir evento para actualizar el pedido en tiempo real
            io.emit('pedidoBebidaActualizado', pedidoBebida); // Notificar a los clientes conectados

            res.status(200).json(pedidoBebida);
        } catch (error) {
            console.error('Error actualizando estado de preparación:', error);
            res.status(400).json({ error: error.message });
        }
    });


    router.put('/:pedidoId/actualizar-bebida/:bebidaId', authenticateToken, async (req, res) => {
    try {
        const { pedidoId, bebidaId } = req.params;

        // Buscar el pedido por su ID
        const pedido = await PedidoBebida.findById(pedidoId);

        if (!pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        console.log('Pedido bebidas:', pedido.bebidas);  // Muestra todo el array de bebidas
        pedido.bebidas.forEach(bebida => {
            console.log('Bebida ID:', bebida._id);  // Muestra el _id de cada bebida
        });

        console.log(bebidaId);
        

        // Buscar la bebida a eliminar usando _id
        const bebidaEliminada = pedido.bebidas.find(bebida =>
            bebida._id.toString() === bebidaId.toString()  // Usar _id para comparar
        );

        if (!bebidaEliminada) {
            return res.status(404).json({ error: 'Bebida no encontrada en este pedido' });
        }

        // Registrar la eliminación en la colección BebidaEliminada
        const bebidaEliminadaRegistrada = new BebidaEliminada({
            mesaId: pedido.mesa,
            bebidaId: bebidaEliminada.bebidaId,
            userId: req.user.id,
            pedidoId: pedidoId,
            cantidad: bebidaEliminada.cantidad,
            motivoEliminacion: 'Eliminado por el usuario',
        });

        await bebidaEliminadaRegistrada.save();

        // Actualizar el total del pedido
        const totalBebidaEliminada = bebidaEliminada.precio * bebidaEliminada.cantidad;
        pedido.total -= totalBebidaEliminada;

        pedido.total = parseFloat(pedido.total.toFixed(2));

        // Eliminar las ventas asociadas a esta bebida
        if (bebidaEliminada.ventas && bebidaEliminada.ventas.length > 0) {
            console.log('Eliminando ventas asociadas a la bebida:', bebidaEliminada.ventas);

            // Eliminar todas las ventas asociadas a la bebida
            for (const ventaId of bebidaEliminada.ventas) {
                await Venta.findByIdAndDelete(ventaId);
                console.log('Venta eliminada:', ventaId);
            }
        }

        // Filtrar la bebida eliminada del pedido
        pedido.bebidas = pedido.bebidas.filter(bebida =>
            bebida._id.toString() !== bebidaId.toString()
        );

        // Buscar la mesa asociada al pedido de bebidas
        const mesa = await Mesa.findOne({ 'pedidoBebidas': pedido._id });

        if (mesa) {
            // Actualizar el total de la mesa restando el total de la bebida eliminada
            mesa.total -= totalBebidaEliminada;

            // Guardar la mesa actualizada
            await mesa.save();

            // Emitir evento para notificar a los clientes sobre la actualización de la mesa
            io.emit('mesaActualizada', mesa); // Notificar en tiempo real
        }

        // Si no quedan bebidas en el pedido, eliminar todo el pedido
        if (pedido.bebidas.length === 0) {
            // Eliminar el pedido completo
            await PedidoBebida.findByIdAndDelete(pedido._id);

            if (mesa) {
                // Eliminar la referencia al pedido de bebidas de la mesa
                mesa.pedidoBebidas = mesa.pedidoBebidas.filter(pedidoBebidaId =>
                    pedidoBebidaId.toString() !== pedido._id.toString()
                );

                // Guardar la mesa actualizada
                await mesa.save();

                // Emitir evento para notificar a los clientes sobre la eliminación de la mesa
                io.emit('mesaEliminada', mesa);
            }

            // Emitir evento para notificar que el pedido ha sido eliminado
            io.emit('pedidoEliminado', pedido);
            return res.status(200).json({ message: 'Pedido eliminado porque no tiene bebidas' });
        }

        // Guardar los cambios en el pedido si no está vacío
        await pedido.save();

        // Emitir evento para actualizar el pedido en tiempo real
        io.emit('pedidoActualizado', pedido);

        res.status(200).json(pedido);
    } catch (error) {
        console.error('Error eliminando bebida:', error);
        res.status(400).json({ error: error.message });
    }
});

    

    router.put('/:id/completado', async (req, res) => {
        try {
            const pedidoBebida = await PedidoBebida.findByIdAndUpdate(req.params.id, { estado: 'completado' }, { new: true });
            if (!pedidoBebida) {
                return res.status(404).json({ error: 'Pedido no encontrado' });
            }

            // Emitir evento para actualizar el estado del pedido de bebidas
            io.emit('pedidoBebidaFinalizado', pedidoBebida); // Enviar el pedido de bebidas finalizado a todos los clientes

            res.status(200).json(pedidoBebida);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });


    return router;
};
