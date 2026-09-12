const fs = require('fs');

const oldStr = '{new Date(task.dueDate).toLocaleDateString()}{task.dueTime ? " " + task.dueTime : ""}';
const newStr = `{new Date(task.dueDate).toLocaleDateString()} {task.dueTime && <span className="inline-block ml-2 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-bold">{new Date('1970-01-01T' + task.dueTime).toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit'})}</span>}`;

const files = ['Tasks.jsx', 'Dashboard.jsx', 'Kanban.jsx', 'Archive.jsx', 'Trash.jsx'].map(f => 'c:/Users/admin/OneDrive/Desktop/Intership_project/client/src/pages/' + f);

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replaceAll(oldStr, newStr);
  fs.writeFileSync(f, content, 'utf8');
});

let cal = 'c:/Users/admin/OneDrive/Desktop/Intership_project/client/src/pages/Calendar.jsx';
let calContent = fs.readFileSync(cal, 'utf8');
calContent = calContent.replaceAll(
  '{task.dueTime && <span className="text-xs text-gray-400 ml-2">{task.dueTime}</span>}',
  `{task.dueTime && <span className="inline-block ml-2 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-bold">{new Date('1970-01-01T' + task.dueTime).toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit'})}</span>}`
);
fs.writeFileSync(cal, calContent, 'utf8');

console.log('Updated to AM/PM separate badge!');
