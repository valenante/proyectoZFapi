// controllers/cerrarCajaController.js
const MesaEliminada = require('../models/MesaEliminada');
const enviarCorreo = require('../utils/enviarCorreo');
const Pedido = require('../models/Pedido');
const PedidoBebida = require('../models/PedidoBebidas');
const BebidaEliminada = require('../models/BebidaEliminada');
const PlatoEliminado = require('../models/PlatoEliminado');

const enviarInforme = async (req, res) => {
    try {
        // Obtener las mesas eliminadas
        const mesas = await MesaEliminada.find().populate('detallesMesa.pedidos').populate('detallesMesa.pedidoBebidas');

        // Obtener todos los pedidos y bebidas necesarios para cruzar datos
        const pedidos = await Pedido.find({ estado: 'completado' }).populate('platos.platoId');
        const pedidoBebidas = await PedidoBebida.find({ estado: 'completado' }).populate('bebidas.bebidaId');

        // Calcular el total de efectivo y tarjeta
        const totalEfectivo = mesas.reduce((acc, mesa) => acc + (mesa.metodoPago?.efectivo || 0), 0);
        const totalTarjeta = mesas.reduce((acc, mesa) => acc + (mesa.metodoPago?.tarjeta || 0), 0);
        const total = totalEfectivo + totalTarjeta;

        // Generar el informe para cada mesa eliminada
        let informeMesas = '';
        mesas.forEach((mesa) => {
            const numeroMesa = mesa.numeroMesa || 'Desconocido';
            const horaMesa = new Date(mesa.detallesMesa.updatedAt).toLocaleTimeString();

            // Filtrar los pedidos de esta mesa
            const pedidosMesa = pedidos.filter((pedido) =>
                mesa.detallesMesa.pedidos.some((pedidoId) => pedido._id.equals(pedidoId))
            );

            // Filtrar las bebidas de esta mesa
            const bebidasMesa = pedidoBebidas.filter((bebida) =>
                mesa.detallesMesa.pedidoBebidas.some((bebidaId) => bebida._id.equals(bebidaId))
            );

            // Construir detalles de los pedidos
            let detallePedidos = '';
            pedidosMesa.forEach((pedido) => {
                const productosVendidos = pedido.platos.map(p => `${p.cantidad}x ${p.nombre} (€${(p.precios * p.cantidad).toFixed(2)})`).join(', ');

                detallePedidos += `
                    <p><strong>Platos vendidos:</strong> ${productosVendidos}</p>
                    <p><strong>Total del Pedido:</strong> €${pedido.total.toFixed(2)}</p>
                    <hr />
                `;
            });

            // Construir detalles de las bebidas
            let detalleBebidas = '';
            bebidasMesa.forEach((bebida) => {
                const productosVendidos = bebida.bebidas.map(p => `${p.cantidad}x ${p.nombre} (€${(p.precio * p.cantidad).toFixed(2)})`).join(', ');

                detalleBebidas += `
                    <p><strong>Bebidas vendidas:</strong> ${productosVendidos}</p>
                    <p><strong>Total de las Bebidas:</strong> €${bebida.total.toFixed(2)}</p>
                    <hr />
                `;
            });

            // Agregar información de la mesa al informe
            informeMesas += `
                <h3>Mesa ${numeroMesa} - ${horaMesa}</h3>
                <p><strong>Total Mesa:</strong> €${mesa.total.toFixed(2)}</p>
                <p><strong>Pago en Efectivo:</strong> €${mesa.metodoPago.efectivo.toFixed(2)}</p>
                <p><strong>Pago con Tarjeta:</strong> €${mesa.metodoPago.tarjeta.toFixed(2)}</p>
                <h4>Detalles de los Pedidos:</h4>
                ${detallePedidos || '<p>No hay pedidos para esta mesa.</p>'}
                <h4>Detalles de las Bebidas:</h4>
                ${detalleBebidas || '<p>No hay bebidas para esta mesa.</p>'}
                <hr />
            `;
        });

        const informe = `
            <h1>Resumen de Caja</h1>
            <p><strong>Total Efectivo:</strong> €${totalEfectivo.toFixed(2)}</p>
            <p><strong>Total Tarjeta:</strong> €${totalTarjeta.toFixed(2)}</p>
            <p><strong>Total General:</strong> €${total.toFixed(2)}</p>
            <h2>Detalles por Mesa:</h2>
            ${informeMesas}
        `;

        // Enviar el correo
        await enviarCorreo({
            to: 'bautistaantenucci@gmail.com',
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
