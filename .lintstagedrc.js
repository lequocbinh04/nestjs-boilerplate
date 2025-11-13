module.exports = {
  '*.{ts,tsx,js,jsx,json}': [
    'biome check --write --no-errors-on-unmatched --files-ignore-unknown=true',
  ],
  '*.{ts,tsx}': [
    () => 'tsc --noEmit', // Type check
  ],
};
