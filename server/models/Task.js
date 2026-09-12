const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category:    { type: String, required: true, enum: ['Work', 'Personal', 'Study', 'Health', 'Other'] },
  priority:    { type: String, required: true, enum: ['High', 'Medium', 'Low'] },
  status:      { type: String, enum: ['To Do', 'In Progress', 'Completed'], default: 'To Do' },
  dueDate:     { type: Date, required: true },
  dueTime:     { type: String, default: '' },
  archived:    { type: Boolean, default: false },
  deleted:     { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
