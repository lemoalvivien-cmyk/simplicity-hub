import { readFileSync, writeFileSync, existsSync } from 'fs';

const GITIGNORE_PATH = '.gitignore';
const REQUIRED_LINES = [
  '# Environment variables — NEVER commit secrets',
  '.env',
  '.env.*',
  '.env.local',
  '.env.production',
  '*.env',
  '!.env.example',
];

if (!existsSync(GITIGNORE_PATH)) {
  writeFileSync(GITIGNORE_PATH, REQUIRED_LINES.join('\n') + '\n');
  console.log('✓ .gitignore created with env protection');
  process.exit(0);
}

const content = readFileSync(GITIGNORE_PATH, 'utf8');
const missing = REQUIRED_LINES.filter(line => !content.includes(line));

if (missing.length > 0) {
  writeFileSync(GITIGNORE_PATH, content + '\n' + missing.join('\n') + '\n');
  console.log('✓ .gitignore patched — added:', missing.join(', '));
} else {
  console.log('✓ .gitignore already contains all env protection rules');
}
