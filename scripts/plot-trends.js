#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { loadConfig } = require('./config');
const { parseArgs } = require('./utils');
const { requireNonEmpty, safeOutputPath } = require('./validators');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        value += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(value);
      value = '';
    } else if (ch === '\n') {
      row.push(value.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      value = '';
    } else {
      value += ch;
    }
  }

  if (value.length || row.length) {
    row.push(value.replace(/\r$/, ''));
    rows.push(row);
  }

  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1).filter(r => r.some(cell => cell !== '')).map(r => {
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = r[idx] ?? ''; });
    return obj;
  });
}

function readInput(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  if (filePath.toLowerCase().endsWith('.json')) {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.items)) return parsed.items;
    throw new Error('Unsupported JSON shape. Expected an array or an object with items[]');
  }
  if (filePath.toLowerCase().endsWith('.csv')) {
    return parseCsv(text);
  }
  throw new Error('Unsupported input format. Use .csv or .json');
}

function startOfWeek(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = utc.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  utc.setUTCDate(utc.getUTCDate() + diff);
  return utc.toISOString().slice(0, 10);
}

function weeklyCounts(items, fieldName) {
  const counts = new Map();
  for (const item of items) {
    const raw = item[fieldName];
    if (!raw) continue;
    const week = startOfWeek(raw);
    if (!week) continue;
    counts.set(week, (counts.get(week) || 0) + 1);
  }
  return counts;
}

function mergeSeries(createdMap, closedMap) {
  const weeks = Array.from(new Set([...createdMap.keys(), ...closedMap.keys()])).sort();
  return weeks.map(week => ({
    week,
    created: createdMap.get(week) || 0,
    closed: closedMap.get(week) || 0,
  }));
}

function buildHtml(series, title) {
  const labels = series.map(x => x.week);
  const created = series.map(x => x.created);
  const closed = series.map(x => x.closed);
  const summaryRows = series.map(x => `<tr><td>${x.week}</td><td>${x.created}</td><td>${x.closed}</td></tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; margin: 24px; color: #1f2937; background: #f8fafc; }
    .card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); margin-bottom: 20px; }
    h1 { margin: 0 0 8px; font-size: 24px; }
    p { margin: 0 0 16px; color: #475569; }
    table { border-collapse: collapse; width: 100%; background: white; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
    th { background: #f1f5f9; }
    canvas { max-width: 100%; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>Weekly trend of created tickets vs closed tickets.</p>
    <canvas id="trendChart" height="120"></canvas>
  </div>
  <div class="card">
    <table>
      <thead>
        <tr><th>Week</th><th>Created</th><th>Closed</th></tr>
      </thead>
      <tbody>${summaryRows}</tbody>
    </table>
  </div>
  <script>
    const ctx = document.getElementById('trendChart');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(labels)},
        datasets: [
          {
            label: 'Created',
            data: ${JSON.stringify(created)},
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.15)',
            tension: 0.25,
            fill: false
          },
          {
            label: 'Closed',
            data: ${JSON.stringify(closed)},
            borderColor: '#16a34a',
            backgroundColor: 'rgba(22,163,74,0.15)',
            tension: 0.25,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  </script>
</body>
</html>`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = requireNonEmpty(args.input, 'input');
  const out = args.out || 'weekly-trend.html';
  const title = args.title || 'Created vs Closed Tickets per Week';
  const config = loadConfig();

  const inputPath = path.isAbsolute(input) ? input : path.join(config.skillDir, input);
  if (!fs.existsSync(inputPath)) throw new Error(`Input file not found: ${inputPath}`);

  const items = readInput(inputPath);
  const createdMap = weeklyCounts(items, 'createdDate');
  const closedMap = weeklyCounts(items, 'closedDate');
  const series = mergeSeries(createdMap, closedMap);
  const html = buildHtml(series, title);
  const outputPath = safeOutputPath(config.outputDir, out);
  fs.writeFileSync(outputPath, html);

  console.log(JSON.stringify({
    ok: true,
    inputPath,
    outputPath,
    points: series.length,
    series,
  }, null, 2));
}

main();
