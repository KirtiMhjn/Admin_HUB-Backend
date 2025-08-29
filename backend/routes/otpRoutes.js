const express = require("express");
const User = require("../models/User");
const transporter = require("../config/mailer");

const router = express.Router();

// Step 1: Send OTP
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

  await User.findOneAndUpdate(
    { email },
    { email, otp, otpExpires, verified: false },
    { upsert: true, new: true }
  );

  const mailOptions = {
    from: "yourgmail@gmail.com",
    to: email,
    subject: "Email Verification OTP",
    text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      return res.status(500).send("Error sending OTP");
    }
    res.send("OTP sent successfully");
  });
});

// Step 2: Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(400).send("User not found");
  if (user.otp !== otp) return res.status(400).send("Invalid OTP");
  if (user.otpExpires < Date.now()) return res.status(400).send("OTP expired");

  user.verified = true;
  user.otp = null;
  await user.save();

  res.send("Email verified successfully!");
});

module.exports = router;
