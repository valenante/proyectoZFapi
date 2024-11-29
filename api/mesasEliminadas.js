const express = require('express');
const router = express.Router();
const Mesa = require('../models/Mesa'); // Ajusta la ruta según tu estructura de archivos
const Pedido = require('../models/Pedido'); // Ajusta la ruta según tu estructura de archivos
const MesaEliminada = require('../models/MesaEliminada'); // Ajusta la ruta según tu estructura de archivos

module.exports = (io) => {

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
    
            console.log("Mesa eliminada encontrada:", mesaEliminada);
    
            // Buscar la mesa activa por número (en este caso, la mesa con el número de la mesa eliminada)
            const mesaActiva = await Mesa.findOne({ numero: mesaEliminada.numeroMesa });
    
            if (!mesaActiva) {
                return res.status(404).json({ error: 'Mesa activa no encontrada' });
            }
    
            console.log("Mesa activa encontrada:", mesaActiva);
    
            let totalAcumulado = 0; // Inicializamos el total acumulado
    
            // Recuperar los pedidos asociados de la mesa eliminada
            const pedidosRecuperados = await Promise.all(mesaEliminada.detallesMesa.pedidos.map(async (pedidoId) => {
                // Recuperamos el pedido completo usando el ObjectId
                const pedido = await Pedido.findById(pedidoId);
    
                if (!pedido) {
                    console.error("Pedido no encontrado con ID:", pedidoId);
                    return null;
                }
    
                console.log("Pedido recuperado:", pedido);
    
                // Calcular el total acumulado
                totalAcumulado += pedido.total;
    
                // Actualizar el pedido: desvincular `mesaDia` y asignar `mesa`
                const pedidoActualizado = await Pedido.findByIdAndUpdate(
                    pedido._id,
                    {
                        $unset: { mesaDia: "" },
                        $set: { mesa: mesaActiva._id },
                    },
                    { new: true }
                );
    
                if (!pedidoActualizado) {
                    console.error("No se pudo actualizar el pedido con ID:", pedido._id);
                    return null;
                }
    
                console.log("Pedido actualizado:", pedidoActualizado);
    
                return pedidoActualizado;
            }));
    
            // Filtrar los pedidos válidos (en caso de que algunos no se hayan actualizado)
            const pedidosActualizados = pedidosRecuperados.filter(pedido => pedido !== null);
    
            // Verificación de los pedidos recuperados
            console.log("Pedidos recuperados y actualizados:", pedidosActualizados);
    
            // Actualizar los datos de la mesa activa
            mesaActiva.estado = 'abierta';
            mesaActiva.pedidos = pedidosActualizados.map(pedido => pedido._id);
            mesaActiva.total = totalAcumulado; // Asignar el total acumulado
    
            console.log("Mesa activa después de actualizar con pedidos:", mesaActiva);
    
            // Guardar los cambios en la mesa activa
            await mesaActiva.save();
    
            // Eliminar la mesa de la colección de mesas eliminadas
            await MesaEliminada.findByIdAndDelete(req.params.mesaId);
    
            // Emitir un evento con la mesa actualizada para los clientes conectados
            io.emit('mesarecuperada', mesaActiva);
    
            res.status(200).json({
                message: 'Mesa recuperada y actualizada con éxito.',
                mesa: mesaActiva,
            });
        } catch (error) {
            console.error("Error al recuperar la mesa:", error);
            res.status(400).json({ error: error.message });
        }
    });
    

    return router;
}