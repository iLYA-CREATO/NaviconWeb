// Simple syntax test
console.log('Testing syntax...');

// Try to require the component
try {
    // Just test if the file can be read
    const fs = require('fs');
    const content = fs.readFileSync('CRM_base/frontend/src/components/Settings.jsx', 'utf8');
    console.log('File read successfully, length:', content.length);

    // Basic syntax check - count brackets
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;

    console.log('Braces: {', openBraces, '} ', closeBraces);
    console.log('Parens: (', openParens, ') ', closeParens);

    if (openBraces === closeBraces && openParens === closeParens) {
        console.log('Basic syntax check passed');
    } else {
        console.log('Basic syntax check failed');
    }
} catch (error) {
    console.error('Error:', error.message);
}