const express = require('express');
const router = express.Router();
const Bebida = require('../models/Bebidas'); // Ajusta la ruta según tu estructura de archivos
const multer = require('multer');
const path = require('path');
const Venta = require('../models/Ventas');
const bebidaEliminada = require('../models/BebidaEliminada');

// Configuración de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/images'));  // Guardar en la carpeta 'images'
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

router.post('/', upload.single('img'), async (req, res) => {
    try {
        const { nombre, descripcion, categoria, precio } = req.body;
        console.log(req.body);  // Esto te permitirá ver si la imagen está llegando correctamente

        // Extrae el nombre del archivo subido
        const img = req.file ? 'images/' + req.file.filename : null;  // Guardar la ruta completa

        if (!nombre || !descripcion || !categoria || !precio || !img) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        const nuevaBebida = new Bebida({
            nombre,
            descripcion,
            categoria,
            precio,
            img, // Guarda la ruta relativa de la imagen
        });

        await nuevaBebida.save();
        res.status(201).json(nuevaBebida);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// Obtener todas las bebidas o filtrar por parámetros (como categoria)
router.get('/', async (req, res) => {
    try {
        // Obtener el parámetro 'categoria' de la query string
        const { categoria } = req.query;

        // Si se pasa un parámetro 'categoria', filtra las bebidas por esa categoría
        if (categoria) {
            const bebidas = await Bebida.find({ categoria: categoria });
            res.status(200).json(bebidas);
        } else {
            // Si no hay 'categoria', devuelve todas las bebidas
            const bebidas = await Bebida.find();
            res.status(200).json(bebidas);
        }
    } catch (error) {
        // En caso de error, devuelve un mensaje de error con el código 500
        res.status(500).json({ error: error.message });
    }
});

// Obtener categorías de bebidas
router.get('/categorias/bebidas', async (req, res) => {
    try {
        // Obtenemos las categorías únicas de bebidas
        const categorias = await Bebida.distinct('categoria'); // 'categoria' es el campo que representa las categorías

        if (!categorias.length) {
            return res.status(404).json({ error: 'No se encontraron categorías para bebidas' });
        }

        res.status(200).json(categorias);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Backend - Obtener bebidas de una categoría
router.get('/categorias/:categoriaId', async (req, res) => {
    try {
        const categoriaId = req.params.categoriaId;
        const bebidas = await Bebida.find({ categoria: categoriaId });

        if (!bebidas.length) {
            return res.status(404).json({ error: 'No se encontraron bebidas para esta categoría' });
        }

        res.status(200).json(bebidas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener una bebida por ID
router.get('/:id', async (req, res) => {
    try {
        const bebida = await Bebida.findById(req.params.id);
        if (!bebida) {
            return res.status(404).json({ error: 'Bebida no encontrada' });
        }
        res.status(200).json(bebida);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar una bebida
router.put('/:id', async (req, res) => {
    try {
        const bebidaActualizada = await Bebida.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!bebidaActualizada) {
            return res.status(404).json({ error: 'Bebida no encontrada' });
        }
        res.status(200).json(bebidaActualizada);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Eliminar una bebida
router.delete('/:id', async (req, res) => {
    try {
        const bebidaEliminada = await Bebida.findByIdAndDelete(req.params.id);
        if (!bebidaEliminada) {
            return res.status(404).json({ error: 'Bebida no encontrada' });
        }
        res.status(204).send(); // Sin contenido
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}),

module.exports = router;
