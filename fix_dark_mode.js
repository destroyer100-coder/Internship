const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'client/src'));

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  // Headings & Main Text
  content = content.replaceAll('text-[#111827]', 'text-[#111827] dark:text-white');
  // Avoid double replacing if it was already replaced
  content = content.replaceAll('text-[#111827] dark:text-white dark:text-white', 'text-[#111827] dark:text-white');

  // Labels & Subtext
  content = content.replaceAll('text-[#374151]', 'text-[#374151] dark:text-gray-200');
  content = content.replaceAll('text-[#374151] dark:text-gray-200 dark:text-gray-200', 'text-[#374151] dark:text-gray-200');

  // Muted Text
  content = content.replaceAll('text-[#6B7280]', 'text-[#6B7280] dark:text-gray-400');
  content = content.replaceAll('text-[#6B7280] dark:text-gray-400 dark:text-gray-400', 'text-[#6B7280] dark:text-gray-400');
  
  // Also replace some hardcoded whites and grays where necessary
  content = content.replaceAll('bg-white', 'bg-white dark:bg-[#1E293B]');
  content = content.replaceAll('bg-white dark:bg-[#1E293B] dark:bg-[#1E293B]', 'bg-white dark:bg-[#1E293B]');
  
  content = content.replaceAll('bg-[#F8FAFC]', 'bg-[#F8FAFC] dark:bg-[#0F172A]');
  content = content.replaceAll('bg-[#F8FAFC] dark:bg-[#0F172A] dark:bg-[#0F172A]', 'bg-[#F8FAFC] dark:bg-[#0F172A]');
  
  content = content.replaceAll('bg-[#F3F4F6]', 'bg-[#F3F4F6] dark:bg-[#1E293B]');
  content = content.replaceAll('bg-[#F3F4F6] dark:bg-[#1E293B] dark:bg-[#1E293B]', 'bg-[#F3F4F6] dark:bg-[#1E293B]');

  content = content.replaceAll('border-[#E5E7EB]', 'border-[#E5E7EB] dark:border-[#334155]');
  content = content.replaceAll('border-[#E5E7EB] dark:border-[#334155] dark:border-[#334155]', 'border-[#E5E7EB] dark:border-[#334155]');

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    console.log('Fixed Dark Mode in: ' + path.basename(f));
  }
});
