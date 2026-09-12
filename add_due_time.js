const fs = require('fs');

const files = ['Tasks.jsx', 'Dashboard.jsx', 'Kanban.jsx', 'Archive.jsx', 'Trash.jsx'].map(f => 'c:/Users/admin/OneDrive/Desktop/Intership_project/client/src/pages/' + f);

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replaceAll(
    '{new Date(task.dueDate).toLocaleDateString()}',
    '{new Date(task.dueDate).toLocaleDateString()}{task.dueTime ? " " + task.dueTime : ""}'
  );
  fs.writeFileSync(f, content, 'utf8');
});

let cal = 'c:/Users/admin/OneDrive/Desktop/Intership_project/client/src/pages/Calendar.jsx';
let calContent = fs.readFileSync(cal, 'utf8');
calContent = calContent.replaceAll(
  '<span className="text-xs text-gray-500">{task.status}</span>',
  '<span className="text-xs text-gray-500">{task.status}</span>{task.dueTime && <span className="text-xs text-gray-400 ml-2">{task.dueTime}</span>}'
);
fs.writeFileSync(cal, calContent, 'utf8');

console.log('Added dueTime to all task displays!');
