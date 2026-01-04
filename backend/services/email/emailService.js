const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 587,
  secure: false,
  auth: {
    user: "b640e3bfb443cb",
    pass: "1f993aa18f7de2",
  },
});
const sendEmail = async ({ email, subject, message, html }) => {
  const mailOptions = {
    from: "info@mailtrap.club",
    to: email,
    subject,
    text: message,
    // html: html || `<p>${message}<p>`,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Email sent: ", info.messageId);
  console.log("Preview URL: ", nodemailer.getTestMessageUrl(info));
};

module.exports = sendEmail;
