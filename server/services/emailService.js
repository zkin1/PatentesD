const transporter = require('../config/email');

class EmailService {
  static async sendVerificationCode(email, code) {
    try {
      await transporter.sendMail({
        from: '"Patentes Duoc UC" <noreply@duoc.cl>',
        to: email,
        subject: "Código de verificación para cambio de contraseña",
        text: `Tu código de verificación es: ${code}`,
        html: `<b>Tu código de verificación es: ${code}</b>`
      });
      return true;
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      return false;
    }
  }
}

module.exports = EmailService;