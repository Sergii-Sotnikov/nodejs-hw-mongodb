import nodemailer from 'nodemailer';
import { SMTP } from '../contacts/sortIndex.js';
import { getEnvVar } from '../utils/getEnvVar.js';

let transporter = null;      // создадим один раз при первом вызове
let mailEnabled = true;

async function buildSmtpTransport() {
  // Если явно выключили почту (например, на предпроде)
  const emailEnabledFlag = String(process.env.EMAIL_ENABLED ?? 'true').toLowerCase() === 'true';
  if (!emailEnabledFlag) {
    mailEnabled = false;
    console.warn('[MAIL] Disabled by EMAIL_ENABLED=false');
    return null;
  }

  // Быстрый тестовый режим без реального SMTP:
  // EMAIL_DRIVER=ethereal (НЕ используем в проде)
  const driver = String(process.env.EMAIL_DRIVER ?? '').toLowerCase();
  if (driver === 'ethereal' && process.env.NODE_ENV !== 'production') {
    const testAccount = await nodemailer.createTestAccount();
    console.warn('[MAIL] Using Ethereal test SMTP. Preview links will be printed to logs.');
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure, // true для 465
      auth: { user: testAccount.user, pass: testAccount.pass },
      // таймауты, чтобы не висеть вечно
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
  }

  // Обычный SMTP из ENV
  try {
    const host = getEnvVar(SMTP.SMTP_HOST);
    const port = Number(getEnvVar(SMTP.SMTP_PORT)); // 587 или 465
    const user = getEnvVar(SMTP.SMTP_USER);
    const pass = getEnvVar(SMTP.SMTP_PASSWORD);

    // secure=true для 465, иначе false (STARTTLS на 587)
    const secure =
      String(process.env.SMTP_SECURE ?? (port === 465 ? 'true' : 'false'))
        .toLowerCase() === 'true';

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      // полезные таймауты против зависаний/timeout’ов
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
  } catch (e) {
    // Если нет каких-то ENV — не валим процесс, просто отключаем почту
    mailEnabled = false;
    console.warn('[MAIL] Disabled:', e.message);
    return null;
  }
}

async function getTransporter() {
  if (!transporter && mailEnabled) {
    transporter = await buildSmtpTransport();
  }
  return transporter;
}

export async function sendEmail(options) {
  const tx = await getTransporter();

  if (!mailEnabled || !tx) {
    console.warn('[MAIL] Skipped send: mail is disabled or transporter not ready.');
    return { skipped: true };
  }

  const fromDefault = process.env.SMTP_FROM ?? 'no-reply@example.com';
  const final = { from: options.from ?? fromDefault, ...options };

  const info = await tx.sendMail(final);

  // Для Ethereal удобно вывести превью ссылку в логи
  if (info && nodemailer.getTestMessageUrl) {
    const url = nodemailer.getTestMessageUrl(info);
    if (url) console.log('[MAIL] Preview URL:', url);
  }

  return info;
}