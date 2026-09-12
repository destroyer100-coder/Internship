const nodemailer = require('nodemailer');

// Direct Gmail Transporter using Port 587 (STARTTLS) to prevent network socket drops
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpUser = process.env.SMTP_USER || 'vanshjawla504@gmail.com';
const smtpPass = (process.env.SMTP_PASS || 'ovntqeuliezyrirj').replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: false, // Port 587 uses STARTTLS
  requireTLS: true,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

// ─── Reusable direct email sender ───────────────────────────────────────────
const sendEmail = async (to, subject, html) => {
  const info = await transporter.sendMail({
    from: `TaskFlow <${smtpUser}>`,
    to,
    subject,
    html,
  });
  console.log(`✉️ Direct email sent to ${to} (ID: ${info.messageId})`);
  return info;
};

// ─── Wrap content in TaskFlow branded template ─────────────────────────────
const wrapTemplate = (bodyContent) => `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#F7F5F0;border-radius:16px;overflow:hidden;border:1px solid #DEDCD5;">
    <div style="background:#145A4A;padding:28px 40px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:24px;letter-spacing:-0.5px;">TaskFlow</h1>
    </div>
    <div style="padding:36px 40px;background:#FFFFFF;">
      ${bodyContent}
    </div>
    <div style="padding:18px 40px;background:#F7F5F0;border-top:1px solid #DEDCD5;text-align:center;">
      <p style="color:#89919A;font-size:11px;margin:0;">&copy; ${new Date().getFullYear()} TaskFlow. All rights reserved.</p>
    </div>
  </div>
`;

// ─── OTP Email ─────────────────────────────────────────────────────────────
const sendOtpEmail = async (toEmail, otp) => {
  const html = wrapTemplate(`
    <h2 style="color:#17202A;margin:0 0 12px;font-size:20px;">Verify your email address</h2>
    <p style="color:#5F6872;font-size:14px;line-height:1.7;margin:0 0 28px;">
      Use the one-time verification code below.<br/>
      Valid for <strong>5 minutes</strong>.
    </p>
    <div style="background:#F1EFE9;border:2px dashed #DEDCD5;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
      <p style="color:#89919A;font-size:11px;font-weight:bold;letter-spacing:2px;margin:0 0 10px;text-transform:uppercase;">Your OTP Code</p>
      <p style="color:#145A4A;font-size:46px;font-weight:900;letter-spacing:12px;margin:0;font-family:monospace;">${otp}</p>
    </div>
    <p style="color:#89919A;font-size:12px;margin:0;">If you did not request this code, please ignore this email.</p>
  `);
  return await sendEmail(toEmail, '🔑 Your TaskFlow Verification OTP', html);
};

// ─── Task Created Confirmation ─────────────────────────────────────────────
const sendTaskCreatedEmail = async (toEmail, task) => {
  const priorityColors = { High: '#B65D52', Medium: '#B78332', Low: '#4F8068' };
  const pColor = priorityColors[task.priority] || '#5F6872';
  const dueFormatted = new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const html = wrapTemplate(`
    <h2 style="color:#17202A;margin:0 0 8px;font-size:20px;">✅ New Task Created</h2>
    <p style="color:#5F6872;font-size:13px;margin:0 0 24px;">A new task has been added to your workspace.</p>
    <div style="background:#F7F5F0;border:1px solid #DEDCD5;border-radius:12px;padding:20px;margin-bottom:20px;">
      <h3 style="color:#17202A;margin:0 0 12px;font-size:16px;">${task.title}</h3>
      ${task.description ? `<p style="color:#5F6872;font-size:13px;margin:0 0 16px;line-height:1.6;">${task.description}</p>` : ''}
      <table style="width:100%;font-size:13px;color:#5F6872;">
        <tr>
          <td style="padding:6px 0;"><strong>Category:</strong></td>
          <td style="padding:6px 0;">${task.category}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;"><strong>Priority:</strong></td>
          <td style="padding:6px 0;"><span style="color:${pColor};font-weight:bold;">${task.priority}</span></td>
        </tr>
        <tr>
          <td style="padding:6px 0;"><strong>Due Date:</strong></td>
          <td style="padding:6px 0;">${dueFormatted}${task.dueTime ? ' at ' + task.dueTime : ''}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;"><strong>Status:</strong></td>
          <td style="padding:6px 0;">${task.status}</td>
        </tr>
      </table>
    </div>
  `);
  return await sendEmail(toEmail, `✅ Task Created: ${task.title}`, html);
};

// ─── Due Today Reminder ────────────────────────────────────────────────────
const sendDueReminderEmail = async (toEmail, tasks) => {
  const taskRows = tasks.map(t => {
    const pColor = t.priority === 'High' ? '#B65D52' : t.priority === 'Medium' ? '#B78332' : '#4F8068';
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #DEDCD5;font-size:13px;color:#17202A;font-weight:600;">${t.title}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #DEDCD5;font-size:12px;color:${pColor};font-weight:bold;">${t.priority}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #DEDCD5;font-size:12px;color:#5F6872;">${t.dueTime || 'All day'}</td>
      </tr>
    `;
  }).join('');

  const html = wrapTemplate(`
    <h2 style="color:#17202A;margin:0 0 8px;font-size:20px;">⏰ Tasks Due Today</h2>
    <p style="color:#5F6872;font-size:13px;margin:0 0 24px;">
      You have <strong style="color:#B65D52;">${tasks.length} task${tasks.length > 1 ? 's' : ''}</strong> due today. Don't forget to complete them!
    </p>
    <table style="width:100%;border-collapse:collapse;background:#F7F5F0;border-radius:12px;overflow:hidden;border:1px solid #DEDCD5;">
      <thead>
        <tr style="background:#F1EFE9;">
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:#5F6872;text-transform:uppercase;letter-spacing:1px;">Task</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:#5F6872;text-transform:uppercase;letter-spacing:1px;">Priority</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:#5F6872;text-transform:uppercase;letter-spacing:1px;">Time</th>
        </tr>
      </thead>
      <tbody>${taskRows}</tbody>
    </table>
    <p style="color:#89919A;font-size:12px;margin:20px 0 0;">Open TaskFlow to manage your tasks.</p>
  `);
  return await sendEmail(toEmail, `⏰ ${tasks.length} Task${tasks.length > 1 ? 's' : ''} Due Today`, html);
};

// ─── Overdue Alert ─────────────────────────────────────────────────────────
const sendOverdueEmail = async (toEmail, tasks) => {
  const taskList = tasks.map(t => {
    const dueStr = new Date(t.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return `<li style="padding:6px 0;font-size:13px;color:#17202A;"><strong>${t.title}</strong> <span style="color:#B65D52;">(was due ${dueStr})</span></li>`;
  }).join('');

  const html = wrapTemplate(`
    <h2 style="color:#B65D52;margin:0 0 8px;font-size:20px;">🔴 Overdue Tasks Alert</h2>
    <p style="color:#5F6872;font-size:13px;margin:0 0 20px;">
      You have <strong style="color:#B65D52;">${tasks.length} overdue task${tasks.length > 1 ? 's' : ''}</strong> that need your attention.
    </p>
    <div style="background:#F8EBEA;border:1px solid #E8D0CE;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
      <ul style="margin:0;padding:0 0 0 18px;">${taskList}</ul>
    </div>
    <p style="color:#89919A;font-size:12px;margin:0;">Open TaskFlow to update or complete these tasks.</p>
  `);
  return await sendEmail(toEmail, `🔴 ${tasks.length} Overdue Task${tasks.length > 1 ? 's' : ''} — Action Needed`, html);
};

// ─── Weekly Summary Report ──────────────────────────────────────────────────
const sendWeeklySummaryEmail = async (toEmail, stats) => {
  const { completedCount, pendingCount, completionRate } = stats;
  const html = wrapTemplate(`
    <h2 style="color:#17202A;margin:0 0 8px;font-size:20px;">📊 Weekly Productivity Summary</h2>
    <p style="color:#5F6872;font-size:13px;margin:0 0 24px;">Here is your weekly TaskFlow productivity report.</p>
    
    <div style="display:flex;gap:12px;margin-bottom:24px;">
      <div style="flex:1;background:#EBF3EF;border-radius:12px;padding:16px;text-align:center;">
        <p style="color:#145A4A;font-size:28px;font-weight:bold;margin:0;">${completedCount}</p>
        <p style="color:#5F6872;font-size:11px;margin:4px 0 0;text-transform:uppercase;">Completed</p>
      </div>
      <div style="flex:1;background:#FAF2E6;border-radius:12px;padding:16px;text-align:center;">
        <p style="color:#B78332;font-size:28px;font-weight:bold;margin:0;">${pendingCount}</p>
        <p style="color:#5F6872;font-size:11px;margin:4px 0 0;text-transform:uppercase;">Pending</p>
      </div>
      <div style="flex:1;background:#F1EFE9;border-radius:12px;padding:16px;text-align:center;">
        <p style="color:#17202A;font-size:28px;font-weight:bold;margin:0;">${completionRate}%</p>
        <p style="color:#5F6872;font-size:11px;margin:4px 0 0;text-transform:uppercase;">Completion Rate</p>
      </div>
    </div>
    
    <p style="color:#5F6872;font-size:13px;line-height:1.6;margin:0;">
      Keep up the great work! Plan your upcoming week in TaskFlow to stay organized.
    </p>
  `);
  return await sendEmail(toEmail, `📊 Your Weekly TaskFlow Productivity Summary (${completionRate}% Done)`, html);
};

// ─── Calendar Event Reminder ────────────────────────────────────────────────
const sendCalendarReminderEmail = async (toEmail, eventTitle, eventTimeStr) => {
  const html = wrapTemplate(`
    <h2 style="color:#17202A;margin:0 0 8px;font-size:20px;">📅 Upcoming Event Reminder</h2>
    <p style="color:#5F6872;font-size:13px;margin:0 0 20px;">You have an upcoming event scheduled soon.</p>
    <div style="background:#F3EDF4;border:1px solid #E2D4E5;border-radius:12px;padding:20px;margin-bottom:20px;">
      <h3 style="color:#765C78;margin:0 0 8px;font-size:16px;">${eventTitle}</h3>
      <p style="color:#5F6872;font-size:13px;margin:0;">⏰ Scheduled at: <strong>${eventTimeStr}</strong></p>
    </div>
  `);
  return await sendEmail(toEmail, `📅 Reminder: ${eventTitle}`, html);
};

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendTaskCreatedEmail,
  sendDueReminderEmail,
  sendOverdueEmail,
  sendWeeklySummaryEmail,
  sendCalendarReminderEmail,
};
