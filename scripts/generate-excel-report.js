#!/usr/bin/env node
const path = require('path');
const { spawnSync } = require('child_process');
const { parseArgs } = require('./utils');
const { loadConfig } = require('./config');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = loadConfig();
  const scriptDir = __dirname;

  const jsonOut = args.json || 'query-data.json';
  const xlsxOut = args.xlsx || 'query-report.xlsx';

  const exportArgs = [path.join(scriptDir, 'export-report.js')];
  if (args.mode) exportArgs.push(args.mode);
  if (args.project) exportArgs.push('--project', args.project);
  if (args.team) exportArgs.push('--team', args.team);
  if (args.id) exportArgs.push('--id', args.id);
  if (args.query) exportArgs.push('--query', args.query);
  if (args.fields) exportArgs.push('--fields', args.fields);
  exportArgs.push('--format', 'json', '--out', jsonOut);

  run('node', exportArgs, { cwd: path.resolve(scriptDir, '..') });

  const inputPath = path.join(config.outputDir, jsonOut);
  const outputPath = path.join(config.outputDir, xlsxOut);
  const pythonArgs = [path.join(scriptDir, 'build_excel_report.py'), '--input', inputPath, '--output', outputPath];

  run('python3', pythonArgs, { cwd: path.resolve(scriptDir, '..') });

  console.log(JSON.stringify({
    ok: true,
    jsonPath: inputPath,
    xlsxPath: outputPath,
  }, null, 2));
}

main();
