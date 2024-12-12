const express = require('express');
const router = express.Router();
const Pedido = require('../models/Pedido'); // Ajusta la ruta según tu estructura de archivos
const Mesa = require('../models/Mesa'); // Ajusta la ruta según tu estructura de archivos
const PlatoEliminado = require('../models/PlatoEliminado'); // Ajusta la ruta según tu estructura de archivos
const Plato = require('../models/Plato'); // Ajusta la ruta según tu estructura de archivos
const Venta = require('../models/Ventas'); // Ajusta la ruta según tu estructura de archivos
const authenticateToken = require('../middlewares/authenticateToken'); // Ajusta la ruta según tu estructura de archivos

module.exports = (io) => {
    // Crear un nuevo pedido
    router.post('/', async (req, res) => {
        try {
            // Log del cuerpo de la solicitud
            console.log('Cuerpo de la solicitud:', req.body);

            const { mesa, platos, total, comensales, alergias } = req.body;

            // Buscar la mesa usando el ObjectId de la mesa
            console.log('Buscando mesa con ID:', mesa);
            const mesaExistente = await Mesa.findById(mesa);  // Buscamos por ObjectId (ID de la mesa)

            if (!mesaExistente) {
                console.error('Mesa no encontrada');
                return res.status(404).json({ error: 'Mesa no encontrada' });
            }

            console.log('Mesa encontrada:', mesaExistente);

            // Crear el nuevo pedido con el ObjectId de la mesa
            const nuevoPedido = new Pedido({
                platos,  // Pasamos los platos directamente desde la solicitud
                total,   // Total del pedido
                comensales,
                alergias,
                mesa: mesaExistente._id  // Asignar el ObjectId de la mesa
            });

            console.log('Nuevo pedido a guardar:', nuevoPedido);

            // Redondear el total del pedido a dos decimales
            nuevoPedido.total = parseFloat(nuevoPedido.total.toFixed(2));

            // Guardar el nuevo pedido en la base de datos
            await nuevoPedido.save();
            console.log('Pedido guardado con éxito:', nuevoPedido);

            // Agregar el ID del nuevo pedido al campo 'pedidos' de la mesa
            mesaExistente.pedidos.push(nuevoPedido._id);

            // **Sumar el total del nuevo pedido al total de la mesa**
            mesaExistente.total += nuevoPedido.total; // Supone que 'total' es una propiedad del modelo Pedido

            // Redondear el total de la mesa a dos decimales
            mesaExistente.total = parseFloat(mesaExistente.total.toFixed(2));

            // Guardar la mesa actualizada
            await mesaExistente.save();
            console.log('Mesa actualizada:', mesaExistente);

            // Crear ventas para cada plato del pedido
            for (const plato of platos) {
                console.log('Procesando plato:', plato);

                // Crear la venta
                const venta = new Venta({
                    platoId: plato.platoId, // Asociamos la venta al plato
                    pedidoId: nuevoPedido._id, // Asociamos el pedido a la venta
                    cantidad: plato.cantidad,
                });

                console.log('Venta a guardar:', venta);

                // Guardar la venta en la base de datos
                await venta.save();
                console.log('Venta guardada con éxito:', venta);

                // Ahora agregamos la venta al plato dentro del pedido
                // Buscamos el plato dentro del pedido y asociamos la venta
                const platoEnPedido = nuevoPedido.platos.find(p => p.platoId.toString() === plato.platoId.toString());

                console.log(platoEnPedido);

                if (platoEnPedido) {
                    // Añadimos la venta al campo ventas del plato dentro del pedido
                    platoEnPedido.ventas.push(venta._id);
                    console.log('Venta asociada al plato dentro del pedido:', platoEnPedido);

                    // Guardamos el pedido con la venta asociada al plato
                    await nuevoPedido.save();
                } else {
                    console.error('Plato no encontrado dentro del pedido:', plato.platoId);
                }
            }

            console.log('SIuu') // Este log ahora debería aparecer

            // Emitir un evento con el nuevo pedido para los clientes conectados
            io.emit('nuevoPedido', nuevoPedido);

            console.log('Pedido creado:', nuevoPedido);

            res.status(201).json({
                message: 'Pedido creado con éxito',
                pedidoId: nuevoPedido._id,
                pedido: nuevoPedido
            });
        } catch (error) {
            console.error('Error al procesar el pedido:', error);
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

    router.put('/:pedidoId/actualizar-plato/:platoId', authenticateToken, async (req, res) => {
        try {
            const { pedidoId, platoId } = req.params;

            // Buscar el pedido por su ID
            const pedido = await Pedido.findById(pedidoId);
            if (!pedido) {
                return res.status(404).json({ error: 'Pedido no encontrado' });
            }

            // Buscar el plato a eliminar
            const platoEliminado = pedido.platos.find(
                (plato) => plato._id.toString() === platoId
            );
            if (!platoEliminado) {
                return res.status(404).json({ error: 'Plato no encontrado en este pedido' });
            }

            // Registrar la eliminación
            const platoEliminadoRegistrado = new PlatoEliminado({
                mesaId: pedido.mesa,
                platoId: platoEliminado.platoId,
                pedidoId: pedidoId,
                cantidad: platoEliminado.cantidad,
                motivoEliminacion: 'Eliminado por el usuario',
                userId: req.user.id
            });
            await platoEliminadoRegistrado.save();

            // Actualizar el total del pedido
            const totalPlatoEliminado = platoEliminado.precios[0] * platoEliminado.cantidad;
            pedido.total -= totalPlatoEliminado;

            // Redondeamos a dos decimales
            pedido.total = parseFloat(pedido.total.toFixed(2));

            // Eliminar el plato del pedido
            pedido.platos = pedido.platos.filter(
                (plato) => plato._id.toString() !== platoId
            );

            // Buscar y eliminar la venta asociada al plato eliminado
            const venta = await Venta.findOne({
                platoId: platoEliminado.platoId.toString(),
                pedidoId: pedido._id.toString(),
            });

            if (venta) {
                await Venta.deleteOne({ _id: venta._id });
            }

            // Actualizar el contador de ventas del plato
            const plato = await Plato.findById(platoEliminado.platoId);
            if (plato) {
                await plato.save();
            }

            // Actualizar la mesa asociada al pedido
            const mesa = await Mesa.findOne({ pedidos: pedido._id });

            // Verificar que la mesa existe antes de proceder
            if (!mesa) {
                return res.status(404).json({ error: 'Mesa no encontrada para este pedido' });
            }

            // Actualizamos el total de la mesa solo si la mesa está presente
            mesa.total -= totalPlatoEliminado;

            // Redondeamos el total de la mesa a dos decimales
            mesa.total = parseFloat(mesa.total.toFixed(2));

            // Guardamos los cambios en la mesa
            await mesa.save();

            // Emitir evento para la mesa actualizada
            io.emit('mesaActualizada', mesa);

            // Si no quedan platos en el pedido, lo dejamos en 0 pero no eliminamos el pedido
            if (pedido.platos.length === 0) {
                pedido.total = 0;  // Establecemos el total del pedido a 0
            }

            // Guardamos los cambios en el pedido
            await pedido.save();

            // Emitimos el evento de actualización del pedido
            io.emit('pedidoActualizado', pedido);

            console.log(pedido.platos.length);

            // Si no hay más platos en el pedido, eliminamos el pedido de la mesa y de la base de datos
            if (pedido.platos.length === 0) {
                // Eliminar el pedido de la lista de pedidos de la mesa
                mesa.pedidos = mesa.pedidos.filter(
                    (pedidoId) => pedidoId.toString() !== pedido._id.toString()
                );

                // Actualizar el total de la mesa
                mesa.total -= pedido.total;  // Restamos el total del pedido de la mesa
                mesa.total = parseFloat(mesa.total.toFixed(2));  // Redondeamos el total

                // Guardar los cambios en la mesa
                await mesa.save();

                // Emitir eventos para la actualización de la mesa y el pedido eliminado
                io.emit('mesaActualizada', mesa);
                io.emit('pedidoEliminado', pedido);

                // Eliminar el pedido de la base de datos
                await Pedido.findByIdAndDelete(pedido._id);

                // Responder con un mensaje indicando que el pedido fue eliminado correctamente
                return res.status(200).json({ message: 'Pedido eliminado porque no tiene platos' });
            }


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