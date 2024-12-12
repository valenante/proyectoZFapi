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

    // Endpoint para obtener el id y estado de la mesa a partir del número de mesa
    router.get('/numero/:mesaNumero', async (req, res) => {
        const mesaNumero = req.params.mesaNumero; // Obtener el número de mesa desde la URL

        try {
            // Buscar la mesa por su número
            const mesa = await Mesa.findOne({ numero: mesaNumero }); // Asumiendo que el campo en la base de datos se llama 'numero'

            if (!mesa) {
                return res.status(404).json({ message: 'Mesa no encontrada' });
            }

            // Si se encuentra la mesa, devolver su id y estado
            res.json({ id: mesa._id, estado: mesa.estado });

            console.log(`Mesa encontrada: ID=${mesa._id}, Estado=${mesa.estado}`);
        } catch (error) {
            console.error('Error al obtener la mesa:', error);
            res.status(500).json({ message: 'Error al obtener la mesa' });
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

    router.put('/:id', async (req, res) => {
        try {
            // Buscar la mesa por su _id (el id real de la mesa en la base de datos)
            const mesaActualizada = await Mesa.findByIdAndUpdate(
                req.params.id, // Usamos el id de la mesa en la URL
                { estado: 'abierta' }, // Forzamos el valor de estado a 'abierta'
                { new: true } // Retornamos el documento actualizado
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


    router.put('/cerrar/:id', async (req, res) => {
        try {
            // Buscar la mesa por su ID
            const mesa = await Mesa.findById(req.params.id);

            if (!mesa) {
                return res.status(404).json({ error: 'Mesa no encontrada' });
            }

            const mesaId = mesa._id;

            // Buscar los pedidos asociados a la mesa que estén pendientes
            const pedidosPendientes = await Pedido.find({ mesa: mesaId, estado: { $ne: 'completado' } });
            const bebidasPendientes = await PedidoBebidas.find({ mesa: mesaId, estado: { $ne: 'completado' } });

            // Si hay pedidos pendientes, no permitir cerrar la mesa
            if (pedidosPendientes.length > 0 || bebidasPendientes.length > 0) {
                return res.status(400).json({
                    error: 'No se puede cerrar la mesa mientras haya pedidos pendientes.',
                    pedidosPendientes: pedidosPendientes,
                    bebidasPendientes: bebidasPendientes,
                });
            }

            // Recibir los pagos de la solicitud
            const { efectivo, tarjeta } = req.body.pagos || { efectivo: 0, tarjeta: 0 };

            // Si no hay pagos y el total es mayor que 0, retornar error
            if (mesa.total > 0 && (efectivo + tarjeta) !== mesa.total) {
                return res.status(400).json({ error: 'El total de los pagos no coincide con el total de la mesa' });
            }

            // Crear la mesa eliminada con los pedidos asociados y su total
            const mesaEliminada = new MesaEliminada({
                numeroMesa: mesa.numero,
                detallesMesa: mesa,
                pedidosAsociados: pedidosPendientes.concat(bebidasPendientes),
                numero: mesa.numero,
                total: mesa.total,
                metodoPago: {
                    efectivo: efectivo,
                    tarjeta: tarjeta,
                },
            });

            await mesaEliminada.save();

            // Actualizar los pedidos: desvincularlos de la mesa y agregar `mesaDia`
            await Pedido.updateMany(
                { mesa: mesaId },
                {
                    $unset: { mesa: '' }, // Eliminar el campo `mesa`
                    $set: { mesaDia: mesa.numero }, // Agregar el campo `mesaDia` con el número de la mesa
                }
            );

            // Actualizar los pedidos en PedidoBebidas: desvincularlos de la mesa y agregar `mesaDia`
            await PedidoBebidas.updateMany(
                { mesa: mesaId },
                {
                    $unset: { mesa: '' }, // Eliminar el campo `mesa`
                    $set: { mesaDia: mesa.numero }, // Agregar el campo `mesaDia` con el número de la mesa
                }
            );

            // Actualizar el array `pedidos` de la mesa a vacío, cambiar su estado a cerrada y reiniciar el total
            const mesaActualizada = await Mesa.findByIdAndUpdate(
                mesaId,
                { estado: 'cerrada', pedidos: [], pedidoBebidas: [], tiempoAbierta: 0, total: 0 },
                { new: true }
            );

            if (!mesaActualizada) {
                return res.status(404).json({ error: 'Mesa no encontrada' });
            }

            // Emitir evento de mesa cerrada
            io.emit('mesa-cerrada', { mesa: mesaActualizada });

            res.status(200).json({
                mesa: mesaActualizada,
                mensaje: 'Mesa cerrada y pedidos actualizados correctamente.',
            });
        } catch (error) {
            console.error('Error al cerrar la mesa:', error);
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