const fs = require('fs');
let code = fs.readFileSync('src/components/leads/AddLeadWizard.tsx', 'utf8');

code = code.replace(/maxWidth=\{isComplete \? "max-w-3xl" : "max-w-2xl"\}/, 'maxWidth={isComplete ? "max-w-5xl" : "max-w-4xl"}');
code = code.replace(/<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">/g, '<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">');
code = code.replace(/className="sm:col-span-2"/g, 'className="sm:col-span-2 md:col-span-3"');
code = code.replace(/className="sm:col-span-2 mt-1 flex/g, 'className="sm:col-span-2 md:col-span-3 mt-1 flex');

fs.writeFileSync('src/components/leads/AddLeadWizard.tsx', code);
console.log("Layout updated successfully.");
