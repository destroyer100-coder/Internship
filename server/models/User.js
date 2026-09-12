const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },

  // Notification Preferences
  emailNotifications:      { type: Boolean, default: true },
  taskReminderEnabled:     { type: Boolean, default: true },
  taskReminderFrequency:   { type: String, default: 'Daily' },       // 'Daily', 'Hourly', 'At due time', 'Off'
  dailySummaryTime:        { type: String, default: '08:00' },       // 24h format HH:mm
  overdueAlerts:           { type: Boolean, default: true },

  calendarReminderEnabled: { type: Boolean, default: true },
  calendarReminderTiming:  { type: String, default: '30 minutes before' }, // '10 minutes before', '30 minutes before', '1 hour before', '1 day before'

  weeklySummaryEnabled:    { type: Boolean, default: true },
  weeklySummaryTiming:     { type: String, default: 'Every Monday, 9 AM' }, // 'Every Monday, 9 AM', 'Every Friday, 5 PM', 'Every Sunday, 8 PM'
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
