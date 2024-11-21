const express = require('express');
const router = express.Router();
const Pedido = require('../models/Pedido'); // Ajusta la ruta según tu estructura de archivos

// Crear un nuevo pedido
router.post('/', async (req, res) => {
    try {
        const nuevoPedido = new Pedido(req.body);
        await nuevoPedido.save();
        res.status(201).json({
            message: 'Pedido creado con éxito',
            pedidoId: nuevoPedido._id, // Incluir el ID del pedido creado
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

router.get('/mesa/:numeroMesa', async (req, res) => {
    try {
        const pedidos = await Pedido.find({ mesa: req.params.numeroMesa }); // Usar numeroMesa en lugar de mesaId
        if (!pedidos.length) {
            return res.status(404).json({ error: 'No se encontraron pedidos para esta mesa' });
        }
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
        
        // Agregar el nuevo plato al array de platos
        pedido.platos.push({ platoId, nombre, cantidad, queso, acompanamiento, precios, especificaciones });
        
        // Actualizar el total del pedido (puedes agregar tu lógica para calcular el total)
        pedido.total += precios.precio * cantidad; // Asegúrate de ajustar esto según tu modelo de precios

        await pedido.save();
        res.status(200).json(pedido);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/:id/eliminar-plato/:platoId', async (req, res) => {
    const { id, platoId } = req.params;

    try {
        // Buscar el pedido por ID y poblar los platos con el plato asociado
        const pedido = await Pedido
            .findById(id)
            .populate('platos.platoId'); // Asegúrate de que esto se relacione correctamente con tu esquema

        // Verificar si el pedido existe
        if (!pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        // Buscar el plato que se quiere eliminar usando el _id del plato
        const platoEliminado = pedido.platos.find(plato => 
            plato.platoId._id.toString() === platoId // Comparar _id correctamente
        );
                
        // Verificar si el plato existe en el pedido
        if (!platoEliminado) {
            return res.status(400).json({ error: 'Plato no encontrado en el pedido' });
        }

        // Calcular el nuevo total del pedido, restando el plato eliminado
        // Ajustar el cálculo según el modelo de precios (puedes tener varios precios, racion, tapa, etc.)
        const precioPlato = platoEliminado.platoId.precios.precio || 0; // Si no tienes precios, poner 0
        pedido.total -= precioPlato * platoEliminado.cantidad; // Ajusta según la estructura de tus precios

        // Filtrar el plato eliminado
        pedido.platos = pedido.platos.filter(plato => 
            plato.platoId._id.toString() !== platoId // Comparar _id correctamente
        );

        // Guardar los cambios en el pedido
        await pedido.save();

        // Devolver la respuesta con el pedido actualizado
        res.status(200).json(pedido);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

// Backend - Ruta para actualizar la cantidad de la plato
router.put('/:pedidoId/actualizar-plato/:platoId', async (req, res) => {
    const { pedidoId, platoId } = req.params;
    const { cantidad } = req.body;  // Recibimos la cantidad a actualizar

    console.log(pedidoId, platoId, cantidad);

    try {
        // Buscar el pedido por su ID
        const pedido = await Pedido.findById(pedidoId);
        if (!pedido) {
            return res.status(404).send('Pedido no encontrado');
        }


        // Encontrar la plato dentro del pedido
        const plato = pedido.platos.find(b => b._id.toString() === platoId);

        console.log(pedido.platos)

        if (!plato) {
            return res.status(404).send('Plato no encontrado');
        }

        // Si la cantidad es mayor a 1, restamos 1
        if (plato.cantidad > 1) {
            plato.cantidad -= 1;
        } else {
            // Si la cantidad es 1, eliminamos la plato
            pedido.platos = pedido.platos.filter(b => b._id.toString() !== platoId);
        }

        // Guardamos el pedido actualizado
        await pedido.save();
        res.status(200).json(pedido); // Respondemos con el pedido actualizado

    } catch (err) {
        console.error(err);
        res.status(500).send('Error al actualizar el pedido');
    }
}
);

module.exports = router;
