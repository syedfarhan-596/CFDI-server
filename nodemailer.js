const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAILPASSWORD,
  },
});

async function SendMail(senderEmail, subject, text, body) {
  try {
    const info = await transporter.sendMail({
      from: '"Code For Digital India" <noreply@codefordigitalindia.com>', // sender address
      to: senderEmail, // list of receivers
      subject: subject, // Subject line
      html: `
               <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ccc; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h2 style="margin: 0; color: #007bff;">${subject}</h2>
          </div>
          <div style="padding: 20px;">
            <p style="font-size: 16px; color: #333;">${text}</p>
            <p style="font-size: 16px; color: #333;">${body}</p>
          </div>
          <div style="background-color: #f8f9fa; padding: 10px; text-align: center; font-size: 12px; color: #777;">
            <p style="margin: 0;">This email was sent via Code For Digital India.</p>
          </div>
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
