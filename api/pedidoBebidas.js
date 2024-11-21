const express = require('express');
const router = express.Router();
const PedidoBebida = require('../models/PedidoBebidas'); // Cambia la ruta según tu estructura
const Bebida = require('../models/Bebidas'); // Cambia la ruta según tu estructura

// Crear un nuevo pedido de bebida
router.post('/', async (req, res) => {
    try {
        const nuevoPedidoBebida = new PedidoBebida(req.body);
        await nuevoPedidoBebida.save();
        res.status(201).json({
            message: 'Pedido de bebida creado con éxito',
            pedidoId: nuevoPedidoBebida._id, // Incluir el ID del pedido creado
            pedido: nuevoPedidoBebida
        });
    } catch (error) {
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

// Obtener un pedido de bebida por número de mesa
router.get('/mesa/:numeroMesa', async (req, res) => {
    try {
        const pedidosBebida = await PedidoBebida.find({ mesa: req.params.numeroMesa }); // Usar numeroMesa en lugar de mesaId
        if (!pedidosBebida.length) {
            return res.status(404).json({ error: 'No se encontraron pedidos de bebida para esta mesa' });
        }
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

        console.log(pedidoBebida)

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
// Backend - Ruta para actualizar la cantidad de la bebida
router.put('/:pedidoId/actualizar-bebida/:bebidaId', async (req, res) => {
    const { pedidoId, bebidaId } = req.params;
    const { cantidad } = req.body;  // Recibimos la cantidad a actualizar

    try {
        // Buscar el pedido por su ID
        const pedido = await PedidoBebida.findById(pedidoId);
        if (!pedido) {
            return res.status(404).send('Pedido no encontrado');
        }

        // Encontrar la bebida dentro del pedido
        const bebida = pedido.bebidas.find(b => b._id.toString() === bebidaId);
        if (!bebida) {
            return res.status(404).send('Bebida no encontrada');
        }

        // Si la cantidad es mayor a 1, restamos 1
        if (bebida.cantidad > 1) {
            bebida.cantidad -= 1;
        } else {
            // Si la cantidad es 1, eliminamos la bebida
            pedido.bebidas = pedido.bebidas.filter(b => b._id.toString() !== bebidaId);
        }

        // Guardamos el pedido actualizado
        await pedido.save();
        res.status(200).json(pedido); // Respondemos con el pedido actualizado

    } catch (err) {
        console.error(err);
        res.status(500).send('Error al actualizar el pedido');
    }
});

module.exports = router;
