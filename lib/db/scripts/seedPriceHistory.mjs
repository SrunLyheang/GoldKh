// One-off backfill for `price_snapshots` with real historical spot-gold
// (XAU/USD, USD per troy oz). The app only ever appends a snapshot on a
// lazy refresh, so charts start empty — this seeds them with history.
//
// Get a CSV first (Date,Close in USD/oz), e.g. Stooq (free, no key):
//   curl -L "https://stooq.com/q/d/l/?s=xauusd&i=d" -o xauusd.csv
//
// Then:
//   node --env-file=.env.local lib/db/scripts/seedPriceHistory.mjs xauusd.csv
//
// Idempotent: wipes prior rows with this same source before inserting, so
// re-running with a longer CSV just replaces the seeded history. Live
// goldapi.io rows are untouched.

import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const SOURCE = "stooq.com historical";
const file = process.argv[2];

if (!file) {
  console.error("usage: node seedPriceHistory.mjs <csv-file>");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set (use --env-file=.env.local)");
  process.exit(1);
}

// Parse "Date,Open,High,Low,Close[,Volume]" — case-insensitive header,
// only Date + Close are required. Rows with a non-positive/NaN close or a
// future date are skipped.
const lines = readFileSync(file, "utf8").trim().split(/\r?\n/);
const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
const dateCol = header.indexOf("date");
const closeCol = header.indexOf("close");
if (dateCol === -1 || closeCol === -1) {
  console.error(`CSV needs "Date" and "Close" columns; got: ${header.join(", ")}`);
  process.exit(1);
}

const now = Date.now();
const rows = [];
for (const line of lines.slice(1)) {
  const cells = line.split(",");
  const date = cells[dateCol]?.trim();
  const price = Number(cells[closeCol]);
  if (!date || !Number.isFinite(price) || price <= 0) continue;
  const capturedAt = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(capturedAt.getTime()) || capturedAt.getTime() > now) continue;
  rows.push([price.toFixed(4), capturedAt.toISOString()]);
}

if (rows.length === 0) {
  console.error("no usable rows parsed from CSV");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const insertQueries = [];
for (let i = 0; i < rows.length; i += 500) {
  const chunk = rows.slice(i, i + 500);
  const params = [SOURCE];
  const values = chunk
    .map((_, j) => `($${j * 2 + 2}, $1, $${j * 2 + 3})`)
    .join(", ");
  for (const [price, iso] of chunk) params.push(price, iso);
  insertQueries.push({
    text: `INSERT INTO price_snapshots (price_per_troy_oz, source, captured_at) VALUES ${values}`,
    params,
  });
}

await sql.transaction((txn) => [
  txn.query(`DELETE FROM price_snapshots WHERE source = $1`, [SOURCE]),
  ...insertQueries.map(({ text, params }) => txn.query(text, params)),
]);

console.log(`seeded ${rows.length} snapshots (source: "${SOURCE}")`);
