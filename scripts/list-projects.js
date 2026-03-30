#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

function main() {
  const scriptPath = path.join(__dirname, 'projects.js');
  const result = spawnSync('node', [scriptPath, 'list'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

main();
