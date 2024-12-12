const cron = require('node-cron');
const Venta = require('./models/Venta'); // Modelo de ventas
const CajaDiaria = require('./models/CajaDiaria'); // Modelo de caja diaria

// Tarea programada para ejecutar al final del día
cron.schedule('0 0 * * *', async () => {
    try {
        const hoy = new Date();
        const inicioDia = new Date(hoy.setHours(0, 0, 0, 0));
        const finDia = new Date(hoy.setHours(23, 59, 59, 999));

        // Calcular el total de las ventas del día
        const totalDelDia = await Venta.aggregate([
            {
                $match: {
                    fechaVenta: { $gte: inicioDia, $lte: finDia },
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$total' }, // Sumar el total de todas las ventas
                }
            }
        ]);

        const total = totalDelDia[0]?.total || 0;

        // Registrar la caja en la base de datos
        const caja = new CajaDiaria({
            fecha: inicioDia,
            total: total,
            detalle: [] // Puedes incluir detalles adicionales si lo deseas
        });
        await caja.save();
        console.log(`Caja del día registrada: ${total}€`);
    } catch (error) {
        console.error('Error al registrar la caja diaria:', error);
    }
});
