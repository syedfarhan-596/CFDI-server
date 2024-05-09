const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: process.env.MAIL,
    pass: process.env.MAILPASSWORD,
  },
});

async function SendMail(senderEmail, subject, text, body) {
  try {
    const info = await transporter.sendMail({
      from: '"Code For Digital India" <learningweb2002@gmail.com>', // sender address
      to: senderEmail, // list of receivers
      subject: subject, // Subject line
      html: `
        <div style="font-family: Arial, sans-serif;">
          <p><strong>${subject}</strong></p>
          <p>${text}</p>
          <p>${body}</p>
          <hr />
          <p style="font-size: 12px; color: #777;">This email was sent via Code For Digital India.</p>
        </div>
      `, // HTML body
    });
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("Error occurred while sending email:", error);
    return { success: false, message: "Failed to send email" };
  }
}

module.exports = SendMail;
