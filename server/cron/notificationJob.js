const cron = require('node-cron');
const User = require('../models/User');
const Task = require('../models/Task');
const {
  sendDueReminderEmail,
  sendOverdueEmail,
  sendWeeklySummaryEmail,
  sendCalendarReminderEmail,
} = require('../utils/emailService');

// ─── Runs every hour at :00 — checks Task, Calendar, and Weekly Summary notifications ───
const startNotificationCron = () => {
  cron.schedule('0 * * * *', async () => {
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, '0');
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    console.log(`\n⏰ [Cron] Running notification checks at ${currentHour}:00...`);

    try {
      const users = await User.find({ emailNotifications: true });

      for (const user of users) {
        const userHour = (user.dailySummaryTime || '08:00').split(':')[0];

        // 1. Task Reminders (Daily at preferred hour)
        if (user.taskReminderEnabled !== false && userHour === currentHour) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const dueTodayTasks = await Task.find({
            userId: user._id,
            deleted: false,
            archived: false,
            status: { $ne: 'Completed' },
            dueDate: { $gte: today, $lt: tomorrow },
          });

          const overdueTasks = user.overdueAlerts
            ? await Task.find({
                userId: user._id,
                deleted: false,
                archived: false,
                status: { $ne: 'Completed' },
                dueDate: { $lt: today },
              })
            : [];

          if (dueTodayTasks.length > 0) {
            try {
              await sendDueReminderEmail(user.email, dueTodayTasks);
              console.log(`  📧 Task reminder sent to ${user.email} (${dueTodayTasks.length} tasks)`);
            } catch (err) {
              console.error(`  ❌ Failed task reminder to ${user.email}:`, err.message);
            }
          }

          if (overdueTasks.length > 0) {
            try {
              await sendOverdueEmail(user.email, overdueTasks);
              console.log(`  🔴 Overdue alert sent to ${user.email} (${overdueTasks.length} tasks)`);
            } catch (err) {
              console.error(`  ❌ Failed overdue alert to ${user.email}:`, err.message);
            }
          }
        }

        // 2. Weekly Summary (Monday at 9 AM by default)
        if (user.weeklySummaryEnabled !== false && dayOfWeek === 1 && currentHour === '09') {
          const totalTasks = await Task.countDocuments({ userId: user._id, deleted: false });
          const completedCount = await Task.countDocuments({ userId: user._id, status: 'Completed', deleted: false });
          const pendingCount = totalTasks - completedCount;
          const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

          try {
            await sendWeeklySummaryEmail(user.email, { completedCount, pendingCount, completionRate });
            console.log(`  📊 Weekly summary sent to ${user.email}`);
          } catch (err) {
            console.error(`  ❌ Failed weekly summary to ${user.email}:`, err.message);
          }
        }
      }

      console.log(`⏰ [Cron] Notification check complete.\n`);
    } catch (error) {
      console.error('❌ [Cron] Notification job error:', error.message);
    }
  });

  console.log('📅 Notification cron job started (runs hourly)');
};

module.exports = { startNotificationCron };
