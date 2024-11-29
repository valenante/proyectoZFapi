// controllers/cerrarCajaController.js
const MesaEliminada = require('../models/MesaEliminada');
const enviarCorreo = require('../utils/enviarCorreo');
const Pedido = require('../models/Pedido');
const PedidoBebida = require('../models/PedidoBebidas');
const BebidaEliminada = require('../models/BebidaEliminada');
const PlatoEliminado = require('../models/PlatoEliminado');

// Generar y enviar el informe por correo
const enviarInforme = async (req, res) => {
    try {
        // Obtener las mesas eliminadas
        const mesas = await MesaEliminada.find();

        // Obtener los pedidos relacionados con las mesas eliminadas (solo pedidos cerrados)
        const pedidos = await Pedido.find({ estado: 'completado' }).populate('platos.platoId');

        // Obtener los pedidos de bebidas (solo los cerrados)
        const bebidas = await PedidoBebida.find({ estado: 'completado' }).populate('bebidas.bebidaId');

        // Calcular el total de efectivo y tarjeta
        const totalEfectivo = mesas.reduce((acc, mesa) => acc + (mesa.metodoPago?.efectivo || 0), 0);
        const totalTarjeta = mesas.reduce((acc, mesa) => acc + (mesa.metodoPago?.tarjeta || 0), 0);
        const total = totalEfectivo + totalTarjeta;

        // Obtener la fecha actual
        const fechaActual = new Date().toLocaleDateString();

        // Generar el contenido del informe
        let detallePedidos = '';
        pedidos.forEach((pedido) => {
            const hora = new Date(pedido.createdAt).toLocaleTimeString();
            const productosVendidos = pedido.platos.map(p => `${p.cantidad}x ${p.nombre} (€${(p.precios * p.cantidad).toFixed(2)})`).join(', ');

            detallePedidos += `
                <h3>${hora}</h3>
                <p><strong>Platos vendidos:</strong> ${productosVendidos}</p>
                <p><strong>Precio Plato:</strong> €${pedido.total.toFixed(2)}</p>
                <hr />
            `;
        });

        let detalleBebidas = '';
        bebidas.forEach((bebida) => {
            const hora = new Date(bebida.createdAt).toLocaleTimeString();
            const productosVendidos = bebida.bebidas.map(p => `${p.cantidad}x ${p.nombre} (€${(p.precio * p.cantidad).toFixed(2)})`).join(', ');

            detalleBebidas += `
                <h3>${hora}</h3>
                <p><strong>Bebidas vendidas:</strong> ${productosVendidos}</p>
                <p><strong>Precio Bebida:</strong> €${bebida.total.toFixed(2)}</p>
                <hr />
            `;
        });

        const informe = `
            <h1>Resumen de Caja - ${fechaActual}</h1>
            <p><strong>Efectivo:</strong> €${totalEfectivo.toFixed(2)}</p>
            <p><strong>Tarjeta:</strong> €${totalTarjeta.toFixed(2)}</p>
            <p><strong>Total:</strong> €${total.toFixed(2)}</p>

            <h2>Detalle de Plato:</h2>
            ${detallePedidos}

            <h2>Detalle de Bebidas:</h2>
            ${detalleBebidas}
        `;

        // Enviar el correo
        await enviarCorreo({
            to: 'bautistaantenucci@gmail.com', // Correo destinatario
            subject: 'Informe de Caja',
            body: informe,
        });

        res.json({ success: true, message: 'Informe enviado correctamente.' });
    } catch (error) {
        console.error('Error al enviar el informe:', error);
        res.status(500).json({ success: false, message: 'Error al enviar el informe.' });
    }
};


// Función para limpiar las colecciones de la caja
const limpiarCaja = async (req, res) => {
    try {
        // Eliminar todos los documentos de las mesas eliminadas
        await MesaEliminada.deleteMany({}); // Eliminar todas las mesas de la colección "MesasEliminadas"

        // Eliminar todos los documentos de los pedidos cerrados
        await Pedido.deleteMany({ estado: 'completado' }); // Eliminar todos los pedidos con estado 'completado'

        // Eliminar todos los documentos de los pedidoBebidas cerrados
        await PedidoBebida.deleteMany({ estado: 'completado' }); // Eliminar todos los pedidos con estado 'completado'

        // Eliminar todos los documentos de las bebidas eliminadas
        await BebidaEliminada.deleteMany({}); // Eliminar todas las bebidas de la colección "BebidaEliminada"

        // Eliminar todos los documentos de los platos eliminados
        await PlatoEliminado.deleteMany({}); // Eliminar todos los platos de la colección "PlatoEliminado"

        console.log('Las colecciones de caja han sido limpiadas correctamente.');

        // Enviar respuesta de éxito
        res.status(200).json({
            success: true,
            message: 'Las colecciones han sido limpiadas correctamente.',
        });
    } catch (error) {
        console.error('Error al limpiar las colecciones de caja:', error);
        
        // Enviar respuesta de error
        res.status(500).json({
            success: false,
            message: 'Hubo un problema al limpiar las colecciones.',
        });
    }
};

    

module.exports = { enviarInforme, limpiarCaja };
