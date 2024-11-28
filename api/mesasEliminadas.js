const express = require('express');
const router = express.Router();
const Mesa = require('../models/Mesa'); // Ajusta la ruta según tu estructura de archivos
const Pedido = require('../models/Pedido'); // Ajusta la ruta según tu estructura de archivos
const MesaEliminada = require('../models/MesaEliminada'); // Ajusta la ruta según tu estructura de archivos

router.get('/', async (req, res) => {
    try {
        // Buscar todas las mesas eliminadas y ordenar por '_id' descendente para obtener la última por número de mesa
        const mesasEliminadas = await MesaEliminada.aggregate([
            { $sort: { _id: -1 } },  // Ordenamos por _id de manera descendente
            {
                $group: {
                    _id: "$numeroMesa",   // Agrupamos por numeroMesa
                    mesa: { $first: "$$ROOT" }  // Tomamos el primer documento de cada grupo (el último por fecha)
                }
            },
            { $replaceRoot: { newRoot: "$mesa" } }  // Reemplazamos el root por el documento completo de la mesa
        ]);

        if (mesasEliminadas.length === 0) {
            return res.status(404).json({ mensaje: 'No hay mesas eliminadas' });
        }

        // Retornar las últimas mesas eliminadas por número
        res.status(200).json({ mesas: mesasEliminadas });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error al recuperar las mesas eliminadas' });
    }
});


router.post('/recuperar/:mesaId', async (req, res) => {
    try {
        // Buscar la mesa eliminada usando el _id de la mesa
        const mesaEliminada = await MesaEliminada.findOne({ _id: req.params.mesaId });

        if (!mesaEliminada) {
            return res.status(404).json({ error: 'Mesa eliminada no encontrada' });
        }

        // Buscar la mesa activa por número (en este caso la mesa con número 7)
        const mesaActiva = await Mesa.findOne({ numero: mesaEliminada.numeroMesa });

        if (!mesaActiva) {
            return res.status(404).json({ error: 'Mesa activa no encontrada' });
        }

        // Recuperar los pedidos asociados de la mesa eliminada
        const pedidosRecuperados = await Promise.all(mesaEliminada.pedidosAsociados.map(async (pedido) => {
            // Crear los pedidos asociados en la colección 'Pedidos'
            const nuevoPedido = new Pedido({
                mesa: mesaEliminada.numeroMesa,  // Asignamos el número de mesa
                productos: pedido.productos,     // Los productos del pedido
                total: pedido.total,             // El total del pedido
                platos: pedido.platos,           // Los platos del pedido
                estado: pedido.estado,           // El estado del pedido
                fecha: pedido.fecha              // La fecha del pedido
            });

            // Guardamos cada pedido
            return await nuevoPedido.save();
        }));

        // Actualizar los datos de la mesa activa
        mesaActiva.estado = 'abierta';  // Cambiar el estado a 'abierta'
        mesaActiva.pedidos = pedidosRecuperados.map(pedido => pedido._id);  // Asignar los IDs de los pedidos recuperados

        // Guardar los cambios en la mesa activa
        await mesaActiva.save();

        // Eliminar la mesa de la colección de mesas eliminadas
        await MesaEliminada.findByIdAndDelete(req.params.mesaId);  // Eliminar la mesa de MesaEliminada usando su ID

        res.status(200).json({
            message: 'Mesa recuperada y actualizada con éxito.',
            mesa: mesaActiva,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});



module.exports = router;