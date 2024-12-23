module.exports = (io) => {
  const express = require('express');
  const Cart = require('../models/Cart');
  const router = express.Router();

  // Obtener carrito por mesaId
  router.get('/:mesaId', async (req, res) => {
    try {
      const { mesaId } = req.params;
      const cart = await Cart.findOne({ mesa: mesaId }).populate('platos').populate('bebidas');

      if (!cart) {
        return res.status(404).json({ message: 'Carrito no encontrado' });
      }

      res.json({
        platos: cart.platos,
        bebidas: cart.bebidas,
      });
    } catch (error) {
      console.error('Error al obtener el carrito:', error);
      res.status(500).json({ message: 'Error del servidor' });
    }
  });

  // Agregar productos al carrito
  router.post('/', async (req, res) => {
    try {
      const { mesaId, plato, bebida } = req.body;

      if (!mesaId) {
        return res.status(400).json({ message: 'Faltan datos necesarios (mesaId)' });
      }

      let carrito = await Cart.findOne({ mesa: mesaId });

      if (!carrito) {
        carrito = new Cart({
          mesa: mesaId,
          platos: [],
          bebidas: [],
          total: 0,
        });
      }

      if (plato) {
        carrito.platos.push(plato);
        carrito.total += parseFloat(plato.precio);
      }

      if (bebida) {
        carrito.bebidas.push(bebida);
        carrito.total += parseFloat(bebida.precio * bebida.cantidad);
      }

      await carrito.save();

      // Emitir evento a los clientes
      io.emit('cartUpdated', { mesaId, carrito });

      res.status(200).json(carrito);
    } catch (error) {
      console.error('Error al agregar producto al carrito:', error);
      res.status(500).json({ message: 'Error al actualizar el carrito' });
    }
  });

  router.delete('/cart/:mesaId', async (req, res) => {
    const { mesaId } = req.params;
    console.log(mesaId);
  
    try {
      // Buscar y eliminar el carrito con el id de la mesa, usando el campo 'mesa'
      const result = await Cart.findOneAndDelete({ mesa: mesaId });
  
      if (!result) {
        return res.status(404).json({ message: 'Carrito no encontrado para esta mesa.' });
      }
  
      res.status(200).json({ message: 'Carrito eliminado correctamente.' });
    } catch (error) {
      console.error('Error al eliminar el carrito:', error);
      res.status(500).json({ message: 'Error al eliminar el carrito.' });
    }
  });
  

  // Eliminar producto del carrito
  router.delete('/remove/:itemId', async (req, res) => {
    const { itemId } = req.params;
    const { mesaId, tipo } = req.query;

    try {
      const cart = await Cart.findOne({ mesa: mesaId });

      if (!cart) {
        return res.status(404).json({ message: 'Carrito no encontrado para esta mesa' });
      }

      let itemToRemove;

      if (tipo === 'plato') {
        itemToRemove = cart.platos.find((plato) => plato._id.toString() === itemId);
      } else if (tipo === 'bebida') {
        itemToRemove = cart.bebidas.find((bebida) => bebida._id.toString() === itemId);
      }

      if (!itemToRemove) {
        return res.status(404).json({ message: `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} no encontrado en el carrito` });
      }

      if (tipo === 'plato') {
        if (itemToRemove.cantidad > 1) {
          await Cart.updateOne(
            { mesa: mesaId, 'platos._id': itemId },
            { $inc: { 'platos.$.cantidad': -1 } }
          );
        } else {
          await Cart.updateOne(
            { mesa: mesaId },
            { $pull: { platos: { _id: itemId } } }
          );
        }
      } else if (tipo === 'bebida') {
        if (itemToRemove.cantidad > 1) {
          await Cart.updateOne(
            { mesa: mesaId, 'bebidas._id': itemId },
            { $inc: { 'bebidas.$.cantidad': -1 } }
          );
        } else {
          await Cart.updateOne(
            { mesa: mesaId },
            { $pull: { bebidas: { _id: itemId } } }
          );
        }
      }

      const updatedCart = await Cart.findOne({ mesa: mesaId });
      console.log(updatedCart); 

      if (updatedCart.platos.length === 0 && updatedCart.bebidas.length === 0) {
        await Cart.deleteOne({ mesa: mesaId });
        io.emit('cartUpdated', { mesaId, carrito: null }); // Emitir evento si el carrito está vacío
        return res.status(200).json({ message: 'Carrito vacío, se ha eliminado correctamente' });
      }

      const newTotal = updatedCart.platos.reduce((total, plato) => total + plato.precios.precio * plato.cantidad, 0) +
        updatedCart.bebidas.reduce((total, bebida) => total + bebida.precio * bebida.cantidad, 0);

      await Cart.updateOne({ mesa: mesaId }, { $set: { total: newTotal } });

      io.emit('cartUpdated', { mesaId, carrito: updatedCart }); // Emitir evento con el carrito actualizado

      return res.status(200).json({ message: `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} eliminado correctamente del carrito`, total: newTotal });
    } catch (error) {
      console.error('Error al eliminar el item del carrito:', error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
  });

  return router;
};
