const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "yourgmail@gmail.com",     // your Gmail
    pass: "your-app-password",       // App password from Google
  },
});

module.exports = transporter;
