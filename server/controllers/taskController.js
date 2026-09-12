const Task = require('../models/Task');

const getTasks = async (req, res) => {
  try {
    const { status, category, priority, search, sort } = req.query;
    let query = { userId: req.user._id, deleted: false, archived: false };
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (search) query.title = { $regex: search, $options: 'i' };
    let sortOption = { createdAt: -1 };
    if (sort === 'dueDate') sortOption = { dueDate: 1 };
    if (sort === 'priority') sortOption = { priority: 1 };
    if (sort === 'title') sortOption = { title: 1 };
    res.json(await Task.find(query).sort(sortOption));
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const createTask = async (req, res) => {
  try {
    const { title, description, category, priority, status, dueDate, dueTime } = req.body;
    if (!title || !category || !priority || !dueDate)
      return res.status(400).json({ message: 'Please fill all required fields' });
    const task = await Task.create({ userId: req.user._id, title, description, category, priority, status: status || 'To Do', dueDate, dueTime });
    res.status(201).json(task);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(await Task.findByIdAndUpdate(req.params.id, req.body, { new: true }));
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.deleted = true;
    await task.save();
    res.json({ message: 'Task moved to trash' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const archiveTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.archived = true;
    await task.save();
    res.json({ message: 'Task archived' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const restoreTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.archived = false;
    task.deleted = false;
    await task.save();
    res.json({ message: 'Task restored' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const permanentDelete = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await task.deleteOne();
    res.json({ message: 'Task permanently deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getArchivedTasks = async (req, res) => {
  try {
    res.json(await Task.find({ userId: req.user._id, archived: true, deleted: false }).sort({ updatedAt: -1 }));
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getTrashedTasks = async (req, res) => {
  try {
    res.json(await Task.find({ userId: req.user._id, deleted: true }).sort({ updatedAt: -1 }));
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getAnalytics = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id, deleted: false, archived: false });
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const pending = tasks.filter(t => t.status === 'To Do').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const dueToday = tasks.filter(t => { const d = new Date(t.dueDate); return d >= today && d < tomorrow; }).length;
    const byCategory = {};
    tasks.forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + 1; });
    const byPriority = { High: 0, Medium: 0, Low: 0 };
    tasks.forEach(t => { byPriority[t.priority]++; });
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    res.json({ total, completed, pending, inProgress, dueToday, completionRate, byCategory, byPriority });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getTasks, createTask, getTask, updateTask, deleteTask, archiveTask, restoreTask, permanentDelete, getArchivedTasks, getTrashedTasks, getAnalytics };
