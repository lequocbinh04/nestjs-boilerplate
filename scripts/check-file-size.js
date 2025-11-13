const fs = require('fs');
const { globSync } = require('glob');

const MAX_LINES = 200;
const PATTERNS = ['src/**/*.ts', 'test/**/*.ts'];
const IGNORE = ['**/*.spec.ts', '**/*.test.ts', '**/node_modules/**'];

function checkFileSize() {
  const files = globSync(PATTERNS, { ignore: IGNORE });
  const violations = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n').length;

    if (lines > MAX_LINES) {
      violations.push({ file, lines });
    }
  }

  if (violations.length > 0) {
    console.error('\n❌ File size violations (max 200 lines):');
    violations.forEach(({ file, lines }) => {
      console.error(`  ${file}: ${lines} lines`);
    });
    console.error('\nPlease split large files into smaller modules.\n');
    process.exit(1);
  }

  console.log('✅ All files within 200-line limit');
}

checkFileSize();
