const SendMail = require("./nodemailer");
const SendMailController = (req, res) => {
  SendMail(
    "info@codefordigitalindia.com",
    `Message from ${req.body.name} ,Sender Email:- ${req.body.email}`,
    req.body.message
  );
};

module.exports = SendMailController;
