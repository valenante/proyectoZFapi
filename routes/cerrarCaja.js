// routes/cerrarCaja.js
const express = require('express');
const { enviarInforme } = require('../controllers/cerrarCajaController');
const { limpiarCaja } = require('../controllers/cerrarCajaController');

const router = express.Router();

// Ruta para generar y enviar el informe
router.post('/enviarInforme', enviarInforme);
router.post('/limpiar', limpiarCaja);
module.exports = router;
