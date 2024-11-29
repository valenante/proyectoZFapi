const mongoose = require('mongoose');

const passwordSchema = new mongoose.Schema({
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 6,  // Puedes definir el tamaño mínimo de la contraseña
    },
    fecha: {
        type: Date,
        default: Date.now,  // Guarda la fecha de creación de la contraseña
    },
    estado: {
        type: Boolean,
        default: true,  // Si está activa o no (si la contraseña es válida)
    },
});

const Password = mongoose.model('Password', passwordSchema);

module.exports = Password;
