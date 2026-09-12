const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendOtpEmail } = require('../utils/emailService');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ─── Send OTP ──────────────────────────────────────────────────────────────
const sendOtp = async (req, res) => {
  try {
    const { email, type = 'register' } = req.body;
    if (!email) return res.status(400).json({ message: 'Email address is required' });

    const existingUser = await User.findOne({ email });

    if (type === 'register' && existingUser) {
      return res.status(400).json({ message: 'An account already exists with this email. Please log in.' });
    }

    if ((type === 'login' || type === 'reset') && !existingUser) {
      return res.status(400).json({ message: 'No registered account found with this email. Please register.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.deleteMany({ email });
    await OTP.create({ email, otp });

    await sendOtpEmail(email, otp);
    console.log(`✉️ Direct OTP email sent to: ${email}`);

    res.json({ message: 'OTP verification code sent to your email!' });
  } catch (error) {
    console.error('❌ Send OTP Error:', error);
    res.status(500).json({ message: `Failed to send email: ${error.message}` });
  }
};

// ─── Verify OTP (Validation Only) ─────────────────────────────────────────
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const validOtp = await OTP.findOne({ email, otp });
    if (!validOtp) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Register ──────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Please fill all required fields' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    if (otp) {
      const validOtp = await OTP.findOne({ email, otp });
      if (!validOtp) {
        return res.status(400).json({ message: 'Invalid or expired OTP code' });
      }
      await OTP.deleteMany({ email });
    }

    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Login with Password ───────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Login with OTP ────────────────────────────────────────────────────────
const loginWithOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP code are required' });

    const validOtp = await OTP.findOne({ email, otp });
    if (!validOtp) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No registered account found with this email' });
    }

    await OTP.deleteMany({ email });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Reset Password via OTP ────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const validOtp = await OTP.findOne({ email, otp });
    if (!validOtp) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user account found' });
    }

    user.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
    await user.save();
    await OTP.deleteMany({ email });

    res.json({
      message: 'Password reset successful! You are now logged in.',
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Profile ───────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    res.json(await User.findById(req.user._id).select('-password'));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Update Profile ────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const updated = await user.save();
    res.json({ _id: updated._id, name: updated.name, email: updated.email, token: generateToken(updated._id) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Update Notification Preferences ───────────────────────────────────────
const updateNotificationPrefs = async (req, res) => {
  try {
    const {
      emailNotifications,
      dailySummaryTime,
      overdueAlerts,
      taskReminderEnabled,
      taskReminderFrequency,
      calendarReminderEnabled,
      calendarReminderTiming,
      weeklySummaryEnabled,
      weeklySummaryTiming,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (typeof emailNotifications === 'boolean') user.emailNotifications = emailNotifications;
    if (dailySummaryTime) user.dailySummaryTime = dailySummaryTime;
    if (typeof overdueAlerts === 'boolean') user.overdueAlerts = overdueAlerts;

    if (typeof taskReminderEnabled === 'boolean') user.taskReminderEnabled = taskReminderEnabled;
    if (taskReminderFrequency) user.taskReminderFrequency = taskReminderFrequency;

    if (typeof calendarReminderEnabled === 'boolean') user.calendarReminderEnabled = calendarReminderEnabled;
    if (calendarReminderTiming) user.calendarReminderTiming = calendarReminderTiming;

    if (typeof weeklySummaryEnabled === 'boolean') user.weeklySummaryEnabled = weeklySummaryEnabled;
    if (weeklySummaryTiming) user.weeklySummaryTiming = weeklySummaryTiming;

    await user.save();
    res.json({
      emailNotifications: user.emailNotifications,
      dailySummaryTime: user.dailySummaryTime,
      overdueAlerts: user.overdueAlerts,
      taskReminderEnabled: user.taskReminderEnabled,
      taskReminderFrequency: user.taskReminderFrequency,
      calendarReminderEnabled: user.calendarReminderEnabled,
      calendarReminderTiming: user.calendarReminderTiming,
      weeklySummaryEnabled: user.weeklySummaryEnabled,
      weeklySummaryTiming: user.weeklySummaryTiming,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
  register,
  login,
  loginWithOtp,
  resetPassword,
  getProfile,
  updateProfile,
  updateNotificationPrefs,
};
