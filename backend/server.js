// server.js
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(bodyParser.json());
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000", // allow React frontend
    methods: ["GET", "POST"],
    credentials: true,
  })
);

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
  loginTime: { type: Date, default: Date.now },
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
    const user = await User.findOne({ email: req.body.email });
    
    if (!user) return res.json({ success: false, message: "User not found!" });
    
    if (user.password !== req.body.password)
      return res.json({ success: false, message: "Wrong password!" });

    // Store login in history
    console.log('hiii');
    
    const history = new User({ name: user.name, email: user.email });
    await history.save();

    res.json({ success: true, message: "Login successful!", user: user.name });
    console.log(`✅ User logged in: ${user.email}`);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
    console.log("try again");
  }
});

// ✅ Get Login History (Admin Page)
app.get("/admin/history", async (req, res) => {
  try {
    const history = await User.find().sort({ loginTime: -1 });
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching history" });
  }
});

// Store OTPs temporarily (in memory)
let otpStore = {};

// API to send OTP
app.post("/sendotp", async (req, res) => {
  const { email } = req.body;

  // console.log('hhiii');

  if (!email) return res.status(400).json({ success: false, message: "Email required" });

  // Generate 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  otpStore[email] = {
    otp,
    expiresAt: Date.now() + 30 * 1000, // 30 seconds
  };
  console.log(`✅ Generated OTP for ${email}: ${otp}, expires in 30s`);

  // Setup Gmail transporter
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "kirtismhjn@gmail.com", // your Gmail
      pass: "tlpf mcvv idwp ofck",   // Gmail App Password
    },
  });

  try {
    await transporter.sendMail({
      from: '"OTP System" <kirtismhjn@gmail.com>', // must match user
      to: email,
      subject: "Your OTP Code  (valid for 30s)",
      text: `Your OTP is ${otp}. It will expire in 30 seconds.`,
    });

    res.json({ success: true, message: `OTP sent to ${email}` });
  } catch (err) {
    console.error("❌ Email send error:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
});

// API to verify OTP
// API to verify OTP
app.post("/verify-otp", (req, res) => {
  const { email, enteredOtp } = req.body;

  const record = otpStore[email];

  if (!record) {
    return res.json({ success: false, message: "No OTP found. Please request again." });
  }

  // Check expiry
  if (Date.now() > record.expiresAt) {
    delete otpStore[email]; // remove expired OTP
    return res.json({ success: false, message: "OTP expired. Please request again." });
  }

  // Check correctness
  if (record.otp === enteredOtp) {
    delete otpStore[email]; // clear OTP after success
    return res.json({ success: true, message: "OTP Verified Successfully!" });
  }

  return res.json({ success: false, message: "Invalid OTP" });
});

// ✅ API to update password
app.post("/set-password", async (req, res) => {
  const { email, password } = req.body;
  // console.log("where is error");
  

  try {
    const user = await User.findOneAndUpdate(
      { email: email },
      { password: password },
      { new: true }
    );
      // console.log("where is error");

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
      console.log("where is error");

    res.json({ message: "Password updated successfully!", user });
  } catch (err) {
    res.status(500).json({ message: "Error updating password", error: err });
      console.log("where is error");
  }
});


// ✅ Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
