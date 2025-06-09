const nodemailer = require('nodemailer');

module.exports = async function sendMail({ from, to, subject, text, html }) {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });

  await transporter.sendMail({ from, to, subject, text, html });
};
