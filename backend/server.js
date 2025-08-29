// server.js
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(bodyParser.json());
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000",   // allow React frontend
  methods: ["GET", "POST"],
  credentials: true
}));


// ✅ Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/signupDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log(err));

// ✅ User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  otp: String,
  createdAt: { type: Date, default: Date.now, expires: 300 },
});

const User = mongoose.model("User", userSchema);

// ✅ Signup Route (for testing login)
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.json({ success: false, message: "User already exists!" });
  }

  const newUser = new User({ name, email, password });
  await newUser.save();

  res.json({ success: true, message: "User registered successfully!" });
});

// ✅ Login Route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.json({ success: false, message: "User not found!" });
    if (user.password !== password) return res.json({ success: false, message: "Wrong password!" });

    res.json({ success: true, message: "Login successful!", user: user.name });
     console.log("user found");
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
     console.log("try again");
  }
});

// Store OTPs temporarily (in memory)
let otpStore = {};

// API to send OTP
app.post("/sendotp", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ success: false, message: "Email required" });

  // Generate 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  otpStore[email] = otp;
  l
  console.log(`✅ Generated OTP for ${email}: ${otp}`);

  // Setup Gmail transporter
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "kirtismhjn@gmail.com", // your Gmail
      pass: "ioke hdbm dhht xngx",   // Gmail App Password
    },
  });

  try {
    await transporter.sendMail({
      from: '"OTP System" <kirtismhjn@gmail.com>', // must match user
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}`,
    });

    res.json({ success: true, message: `OTP sent to ${email}` });
  } catch (err) {
    console.error("❌ Email send error:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
});


// API to verify OTP
app.post("/verify-otp", (req, res) => {
  const { email, enteredOtp } = req.body;

  if (otpStore[email] && otpStore[email] === enteredOtp) {
    delete otpStore[email]; // clear OTP after successful verification
    return res.json({ success: true, message: "OTP Verified Successfully!" });
  }

  return res.json({ success: false, message: "Invalid OTP" });
});

// ✅ Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
