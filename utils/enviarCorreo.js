// utils/enviarCorreo.js
const nodemailer = require('nodemailer');

const userGmail = 'valentinoantenucci1@gmail.com';
const passAppGmail = 'fitv cria jfcw pupk';

const enviarCorreo = async ({ to, subject, body }) => {
    console.log('Iniciando proceso de envío de correo...'); // Log de inicio

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: userGmail, // Cambia esto por tu correo
            pass: passAppGmail // Cambia esto por tu contraseña de aplicación
            },
    });

    const mailOptions = {
        from: 'valentinoantenucci1gmail', // Remitente
        to,  // Destinatario
        subject,  // Asunto
        html: body,  // Cuerpo del mensaje
    };

    try {
        console.log(`Enviando correo a ${to} con asunto: ${subject}`); // Log del destinatario y asunto

        // Enviar el correo
        const info = await transporter.sendMail(mailOptions);
        
        console.log('Correo enviado exitosamente: ', info.response); // Log de éxito
    } catch (error) {
        console.error('Error al enviar el correo:', error); // Log del error
        throw new Error('Error al enviar el informe.');
    }
};

module.exports = enviarCorreo;
