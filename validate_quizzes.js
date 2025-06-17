#!/usr/bin/env node

// validate_quizzes.js - script to check data/quizzes.json for syntax and question schema validity

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data', 'quizzes.json');
let content;
try {
  content = fs.readFileSync(filePath, 'utf8');
} catch (err) {
  console.error(`Failed to read file ${filePath}: ${err.message}`);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(content);
} catch (err) {
  console.error(`Invalid JSON in ${filePath}: ${err.message}`);
  process.exit(1);
}

if (!Array.isArray(data)) {
  console.error(`Expected root JSON to be an array, but got ${typeof data}`);
  process.exit(1);
}

let valid = true;
data.forEach((item, index) => {
  if (typeof item.q !== 'string') {
    console.error(`Entry ${index}: 'q' must be a string`);
    valid = false;
  }
  if (!Array.isArray(item.a) || !item.a.every(opt => typeof opt === 'string')) {
    console.error(`Entry ${index}: 'a' must be an array of strings`);
    valid = false;
  }
  if (typeof item.c !== 'number' || !Number.isInteger(item.c) || item.c < 0 || (Array.isArray(item.a) && item.c >= item.a.length)) {
    console.error(`Entry ${index}: 'c' must be an integer index within 'a' array bounds`);
    valid = false;
  }
  if (typeof item.category !== 'number' || !Number.isInteger(item.category)) {
    console.error(`Entry ${index}: 'category' must be an integer`);
    valid = false;
  }
  if ('difficulty' in item && (typeof item.difficulty !== 'number' || !Number.isInteger(item.difficulty))) {
    console.error(`Entry ${index}: 'difficulty' must be an integer if present`);
    valid = false;
  }
  if ('explanation' in item && typeof item.explanation !== 'string') {
    console.error(`Entry ${index}: 'explanation' must be a string if present`);
    valid = false;
  }
});

// Count questions per category
const counts = {};
data.forEach(q => {
  const cat = q.category;
  counts[cat] = (counts[cat] || 0) + 1;
});
console.log('Questions per category:');
Object.keys(counts).sort((a,b)=>a-b).forEach(cat => {
  console.log(`Category ${cat}: ${counts[cat]}`);
});

if (valid) {
  console.log('All quiz entries are valid.');
  process.exit(0);
} else {
  process.exit(1);
} 