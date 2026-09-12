const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getTasks, createTask, getTask, updateTask, deleteTask,
  archiveTask, restoreTask, permanentDelete,
  getArchivedTasks, getTrashedTasks, getAnalytics
} = require('../controllers/taskController');

router.use(protect);

router.get('/analytics', getAnalytics);
router.get('/archived', getArchivedTasks);
router.get('/trashed', getTrashedTasks);
router.patch('/archive/:id', archiveTask);
router.patch('/restore/:id', restoreTask);
router.delete('/permanent/:id', permanentDelete);

router.route('/').get(getTasks).post(createTask);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);

module.exports = router;
