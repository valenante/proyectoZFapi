// controllers/cerrarCajaController.js
const MesaEliminada = require('../models/MesaEliminada');
const enviarCorreo = require('../utils/enviarCorreo');

// Generar y enviar el informe por correo
const enviarInforme = async (req, res) => {
    try {
        // Obtener los datos de las mesas eliminadas
        const mesas = await MesaEliminada.find();

        // Generar el contenido del informe
        const totalEfectivo = mesas.reduce((acc, mesa) => acc + (mesa.metodoPago?.efectivo || 0), 0);
        const totalTarjeta = mesas.reduce((acc, mesa) => acc + (mesa.metodoPago?.tarjeta || 0), 0);
        const total = totalEfectivo + totalTarjeta;

        const informe = `
            <h1>Resumen de Caja</h1>
            <p><strong>Efectivo:</strong> ${totalEfectivo.toFixed(2)} €</p>
            <p><strong>Tarjeta:</strong> ${totalTarjeta.toFixed(2)} €</p>
            <p><strong>Total:</strong> ${total.toFixed(2)} €</p>
        `;

        // Enviar el correo
        await enviarCorreo({
            to: 'correo-destinatario@example.com',
            subject: 'Informe de Caja',
            body: informe,
        });

        res.json({ success: true, message: 'Informe enviado correctamente.' });
    } catch (error) {
        console.error('Error al enviar el informe:', error);
        res.status(500).json({ success: false, message: 'Error al enviar el informe.' });
    }
};

module.exports = { enviarInforme };
