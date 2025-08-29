const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /register
router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send('User already exists');
    }

    // Save new user
    const newUser = new User({ name, email, phone, password });
    await newUser.save();

    res.status(200).send('Signup successful');
  } catch (error) {
    console.error(error);
    res.status(500).send('Signup failed');
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.password !== password) {
      return res.json({ success: false, message: "Invalid password" });
    }

    res.json({ success: true, message: "Login successful" });
  } catch (error) {
    res.json({ success: false, message: "Error: " + error.message });
  }
});




module.exports = router;
