const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const router = express.Router();

router.post('/login', authController.login);

router.post('/register', [
  body('nombre').isString().trim().notEmpty(),
  body('correoInstitucional').isEmail(),
  body('contraseña').isLength({ min: 6 }),
  body('numeroPatente').custom((value) => {
    if (!/^[A-Z]{2}\d{4}$|^[A-Z]{4}\d{2}$/.test(value)) {
      throw new Error('Formato de patente inválido');
    }
    return true;
  }),
  body('numeroTelefono').isMobilePhone()
], authController.register);

router.post('/enviar-codigo', [
  body('correoInstitucional').isEmail()
], authController.enviarCodigoVerificacion);

router.post('/verificar-codigo', [
  body('correoInstitucional').isEmail(),
  body('codigo').isLength({ min: 4, max: 4 })
], authController.verificarCodigo);

router.post('/cambiar-password', [
  body('correoInstitucional').isEmail(),
  body('nuevaPassword').isLength({ min: 6 })
], authController.cambiarPassword);

module.exports = router;