'use strict';

const nodemailer = require('nodemailer');

const env = require('../config/env');
const logger = require('../config/logger');

/**
 * Envio de e-mail (RF02).
 *
 * Sem SMTP configurado, cai no modo console: o e-mail é registrado no log em
 * vez de enviado. Isso mantém o fluxo de recuperação testável em
 * desenvolvimento sem exigir conta de serviço.
 */
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!env.mail.host) {
    transporter = {
      mode: 'console',
      async sendMail(message) {
        logger.info('e-mail (modo console, não enviado)', {
          to: message.to,
          subject: message.subject,
          text: message.text,
        });
        return { messageId: 'console', accepted: [message.to] };
      },
    };
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.port === 465,
    auth: env.mail.user ? { user: env.mail.user, pass: env.mail.password } : undefined,
  });
  transporter.mode = 'smtp';
  return transporter;
}

async function sendPasswordResetEmail({ to, username, resetUrl, expiresInMinutes }) {
  const subject = 'Redefinição de senha — StatsPalpite';
  const text = [
    `Olá, ${username}.`,
    '',
    'Recebemos um pedido para redefinir a sua senha.',
    `Use o link abaixo. Ele vale por ${expiresInMinutes} minutos:`,
    '',
    resetUrl,
    '',
    'Se não foi você quem pediu, ignore esta mensagem. Sua senha continua a mesma.',
  ].join('\n');

  return getTransporter().sendMail({ from: env.mail.from, to, subject, text });
}

/** Usado pelos testes para inspecionar o que seria enviado. */
function resetTransporter(replacement = null) {
  transporter = replacement;
}

module.exports = { getTransporter, sendPasswordResetEmail, resetTransporter };
