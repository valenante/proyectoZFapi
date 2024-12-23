const express = require('express');
const router = express.Router();
const Mesa = require('../models/Mesa'); // Ajusta la ruta según tu estructura de archivos
const Pedido = require('../models/Pedido'); // Ajusta la ruta según tu estructura de archivos
const MesaEliminada = require('../models/MesaEliminada'); // Ajusta la ruta según tu estructura de archivos
const PedidoBebidas = require('../models/PedidoBebidas'); // Ajusta la ruta según tu estructura de archivos

module.exports = (io) => {

    router.get('/', async (req, res) => {
        try {
            const mesasEliminadas = await MesaEliminada.aggregate([
                { $sort: { numeroMesa: 1, _id: -1 } }
            ]);
    
            if (mesasEliminadas.length === 0) {
                return res.status(404).json({ mensaje: 'No hay mesas eliminadas' });
            }
    
            // Mantén todas las mesas en un array plano (sin agrupación manual)
            res.status(200).json({ mesas: mesasEliminadas });
        } catch (error) {
            console.error(error);
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
    
            // Buscar la mesa activa por número
            const mesaActiva = await Mesa.findOne({ numero: mesaEliminada.numeroMesa });
    
            if (!mesaActiva) {
                return res.status(404).json({ error: 'Mesa activa no encontrada' });
            }
    
            console.log("Mesa activa encontrada:", mesaActiva);
    
            let totalAcumulado = 0; // Inicializamos el total acumulado
    
            // Recuperar los pedidos regulares asociados a la mesa eliminada
            const pedidosRecuperados = await Promise.all(mesaEliminada.detallesMesa.pedidos.map(async (pedidoId) => {
                const pedido = await Pedido.findById(pedidoId);
    
                if (!pedido) {
                    console.error("Pedido no encontrado con ID:", pedidoId);
                    return null;
                }
    
                console.log("Pedido recuperado:", pedido);
    
                // Calcular el total acumulado
                totalAcumulado += pedido.total;
    
                // Actualizar el pedido
                const pedidoActualizado = await Pedido.findByIdAndUpdate(
                    pedido._id,
                    {
                        $unset: { mesaDia: "" },
                        $set: { mesa: mesaActiva._id },
                    },
                    { new: true }
                );
    
                return pedidoActualizado || null;
            }));
    
            // Recuperar los pedidos de bebidas asociados a la mesa eliminada
            const bebidasRecuperadas = await Promise.all(mesaEliminada.detallesMesa.pedidoBebidas.map(async (pedidoBebidaId) => {
                const pedidoBebida = await PedidoBebidas.findById(pedidoBebidaId);
    
                if (!pedidoBebida) {
                    console.error("PedidoBebidas no encontrado con ID:", pedidoBebidaId);
                    return null;
                }
    
                console.log("PedidoBebidas recuperado:", pedidoBebida);
    
                // Calcular el total acumulado
                totalAcumulado += pedidoBebida.total;
    
                // Actualizar el pedido de bebidas
                const pedidoBebidaActualizado = await PedidoBebidas.findByIdAndUpdate(
                    pedidoBebida._id,
                    {
                        $unset: { mesaDia: "" },
                        $set: { mesa: mesaActiva._id },
                    },
                    { new: true }
                );
    
                return pedidoBebidaActualizado || null;
            }));
    
            // Filtrar los pedidos válidos
            const pedidosActualizados = pedidosRecuperados.filter(pedido => pedido !== null);
            const bebidasActualizadas = bebidasRecuperadas.filter(bebida => bebida !== null);
    
            console.log("Pedidos recuperados y actualizados:", pedidosActualizados);
            console.log("PedidosBebidas recuperados y actualizados:", bebidasActualizadas);
    
            // Actualizar los datos de la mesa activa
            mesaActiva.estado = 'abierta';
            mesaActiva.pedidos = [
                ...pedidosActualizados.map(pedido => pedido._id),
                ...bebidasActualizadas.map(bebida => bebida._id)
            ];
            mesaActiva.total = totalAcumulado;
    
            console.log("Mesa activa después de actualizar con pedidos y bebidas:", mesaActiva);
    
            // Guardar los cambios en la mesa activa
            await mesaActiva.save();
    
            // Eliminar la mesa de la colección de mesas eliminadas
            await MesaEliminada.findByIdAndDelete(req.params.mesaId);
    
            // Emitir un evento con la mesa actualizada
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
    router.get('/recuperar', async (req, res) => {
        try {
            // Buscar todas las mesas eliminadas y mantener solo la última por número de mesa
            const mesasEliminadas = await MesaEliminada.aggregate([
                { $sort: { numeroMesa: 1, _id: -1 } }, // Ordenar por numeroMesa y luego por _id descendente
                {
                    $group: {
                        _id: "$numeroMesa",     // Agrupar por numeroMesa
                        mesa: { $first: "$$ROOT" } // Tomar el primer documento de cada grupo (el último por _id)
                    }
                },
                { $replaceRoot: { newRoot: "$mesa" } } // Reemplazar el root por el documento de la mesa
            ]);
    
            if (mesasEliminadas.length === 0) {
                return res.status(404).json({ mensaje: 'No hay mesas eliminadas' });
            }
    
            // Retornar las últimas mesas eliminadas por número
            res.status(200).json({ mesas: mesasEliminadas });
        } catch (error) {
            console.error('Error al recuperar las mesas eliminadas:', error);
            res.status(500).json({ error: 'Error al recuperar las mesas eliminadas' });
        }
    });
    
    
    

    return router;
}