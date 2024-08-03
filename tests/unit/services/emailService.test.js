const EmailService = require('../../../server/services/emailService');
const nodemailer = require('nodemailer');

jest.mock('nodemailer');

describe('Email Service', () => {
  let mockSendMail;

  beforeEach(() => {
    mockSendMail = jest.fn();
    nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });
  });

  it('should send verification code email', async () => {
    mockSendMail.mockResolvedValue({ messageId: 'mock-id' });

    const result = await EmailService.sendVerificationCode('test@duoc.cl', '1234');

    expect(result).toBe(true);
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'test@duoc.cl',
      subject: "Código de verificación para cambio de contraseña"
    }));
  });

  it('should handle email sending error', async () => {
    mockSendMail.mockRejectedValue(new Error('Failed to send email'));

    const result = await EmailService.sendVerificationCode('test@duoc.cl', '1234');

    expect(result).toBe(false);
  });
});