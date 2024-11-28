const express = require('express');
const router = express.Router();
const Plato = require('../models/Plato'); // Ajusta la ruta según tu estructura de archivos
const multer = require('multer');
const path = require('path');

// Configuración de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/images'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); // Archivo permitido
    } else {
        cb(new Error('Solo se permiten imágenes en formato JPEG y PNG'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/', upload.single('imagen'), async (req, res) => {
    console.log(req.file)
    try {
        // Parsear los valores que llegan como cadenas JSON
        const precios = JSON.parse(req.body.precios);  // Convertir la cadena de precios a objeto
        const ingredientes = JSON.parse(req.body.ingredientes);  // Convertir la cadena de ingredientes a array
        const opcionesPersonalizables = JSON.parse(req.body.opcionesPersonalizables);  // Convertir la cadena de opciones personalizables a array
        const puntosDeCoccion = JSON.parse(req.body.puntosDeCoccion);  // Convertir la cadena de puntos de cocción a array
        const especificaciones = JSON.parse(req.body.especificaciones);  // Convertir la cadena de especificaciones a array

        // Validar y convertir los precios a números
        const precio = parseFloat(precios.precio);
        const racion = parseFloat(precios.racion);
        const tapa = parseFloat(precios.tapa);

        // Validar que los precios sean números válidos
        if (isNaN(precio) || isNaN(racion) || isNaN(tapa)) {
            return res.status(400).json({ error: 'Los valores de precios deben ser números válidos.' });
        }

        // Crear el objeto de Plato con los datos del body
        const nuevoPlato = new Plato({
            nombre: req.body.nombre,
            descripcion: req.body.descripcion,
            precios: {
                precio,    // Guardar el precio validado y convertido
                racion,    // Guardar la ración validada y convertida
                tapa       // Guardar la tapa validada y convertida
            },
            ingredientes,  // Ya es un array
            opcionesPersonalizables,  // Ya es un array
            puntosDeCoccion,  // Ya es un array
            especificaciones,  // Ya es un array
            imagen: req.file ? `/uploads/${req.file.filename}` : null, // Si se sube una imagen, se guarda la ruta
            categoria: req.body.categoria,
            estado: req.body.estado || 'activo', // Si no se pasa estado, por defecto es 'activo'
            tipo: req.body.tipo
        });

        // Guardar el nuevo plato en la base de datos
        await nuevoPlato.save();

        // Responder con el plato creado
        res.status(201).json(nuevoPlato);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Ruta para actualizar el estado de un plato
router.put('/platos/estado/:id', async (req, res) => {
    try {
        // Buscar el plato por su _id y actualizar su estado
        const platoActualizado = await Plato.findByIdAndUpdate(
            req.params.id,  // Utiliza el ID del plato desde la URL
            { estado: req.body.estado },  // Actualiza el campo estado con el valor enviado en el cuerpo
            { new: true }  // Retorna el documento actualizado
        );

        // Si no se encuentra el plato, devolver error
        if (!platoActualizado) {
            return res.status(404).json({ error: 'Plato no encontrado' });
        }

        // Responder con el plato actualizado
        res.status(200).json(platoActualizado);
    } catch (error) {
        // Si ocurre un error, devolver un mensaje de error
        res.status(400).json({ error: error.message });
    }
});


// Obtener todos los platos
router.get('/', async (req, res) => {
    try {
        const platos = await Plato.find();
        res.status(200).json(platos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/categorias/platos', async (req, res) => {
    try {
        const categorias = await Plato.distinct('categoria');
        res.status(200).json(categorias);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/categorias/:categoria', async (req, res) => {
    try {
        const platos = await Plato.find({ categoria: req.params.categoria });
        res.status(200).json(platos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener un plato por ID
router.get('/:id', async (req, res) => {
    try {
        const plato = await Plato.findById(req.params.id);
        if (!plato) {
            return res.status(404).json({ error: 'Plato no encontrado' });
        }
        res.status(200).json(plato);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar un plato
router.put('/:id', async (req, res) => {
    try {
        const platoActualizado = await Plato.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!platoActualizado) {
            return res.status(404).json({ error: 'Plato no encontrado' });
        }
        res.status(200).json(platoActualizado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Eliminar un plato
router.delete('/:id', async (req, res) => {
    try {
        const platoEliminado = await Plato.findByIdAndDelete(req.params.id);
        if (!platoEliminado) {
            return res.status(404).json({ error: 'Plato no encontrado' });
        }
        res.status(204).send(); // Sin contenido
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
