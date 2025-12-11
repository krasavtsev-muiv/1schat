// Сервис для отправки email
const nodemailer = require('nodemailer');

// Создание транспорта для отправки email
const createTransporter = () => {
  // Если SMTP не настроен, возвращаем null (email не будет отправляться)
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn('SMTP настройки не заданы. Email не будет отправляться.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true для 465, false для других портов
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Отправка ответа на обращение обратной связи
const sendFeedbackResponse = async (feedbackData) => {
  const { email, name, subject, admin_response, admin_name } = feedbackData;

  // Если SMTP не настроен, просто логируем и возвращаемся
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`Email не отправлен (SMTP не настроен). Ответ для ${email}: ${admin_response}`);
    return { sent: false, reason: 'SMTP not configured' };
  }

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'Веб-сервис чата'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to: email,
    subject: `Re: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0070f3;">Ответ на ваше обращение</h2>
        <p>Здравствуйте, ${name}!</p>
        <p>Спасибо за ваше обращение по теме "<strong>${subject}</strong>".</p>
        <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #0070f3; margin: 20px 0;">
          <p style="margin: 0; white-space: pre-wrap;">${admin_response}</p>
        </div>
        ${admin_name ? `<p style="color: #6c757d; font-size: 0.9em;">С уважением,<br>${admin_name}</p>` : ''}
        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
        <p style="color: #6c757d; font-size: 0.85em;">
          Это автоматическое сообщение. Пожалуйста, не отвечайте на это письмо напрямую.
        </p>
      </div>
    `,
    text: `
Здравствуйте, ${name}!

Спасибо за ваше обращение по теме "${subject}".

Ответ:
${admin_response}

${admin_name ? `С уважением,\n${admin_name}` : ''}

---
Это автоматическое сообщение. Пожалуйста, не отвечайте на это письмо напрямую.
    `.trim(),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email отправлен успешно: ${info.messageId} -> ${email}`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('Ошибка отправки email:', error);
    return { sent: false, error: error.message };
  }
};

module.exports = {
  sendFeedbackResponse,
};
