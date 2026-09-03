import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Prices are stored in one canonical unit — USD per troy ounce — per
// CONTEXT.md invariant 2. Unit and currency conversion happens at
// display time, in lib/calc.
export const priceSnapshots = pgTable("price_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  pricePerTroyOz: numeric("price_per_troy_oz", {
    precision: 12,
    scale: 4,
  }).notNull(),
  source: text("source").notNull(),
  // True only for a row inserted by the user-triggered manual refresh
  // route, never by getPrice()'s own staleness-driven insert — see
  // MANUAL_REFRESH_COOLDOWN_MS in lib/constants/staleness.ts.
  isManual: boolean("is_manual").notNull().default(false),
  capturedAt: timestamp("captured_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const transactionTypeEnum = pgEnum("transaction_type", [
  "buy",
  "sell",
]);

export const goldUnitEnum = pgEnum("gold_unit", ["chi", "damlung"]);

export const currencyEnum = pgEnum("currency", ["USD", "KHR"]);

// userId is always the Clerk session user id — never accepted from the
// client. See CONTEXT.md invariant 6.
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  type: transactionTypeEnum("type").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull(),
  unit: goldUnitEnum("unit").notNull(),
  pricePerUnit: numeric("price_per_unit", {
    precision: 14,
    scale: 4,
  }).notNull(),
  currency: currencyEnum("currency").notNull().default("USD"),
  transactionDate: date("transaction_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Fixed-window request counter backing rate limiting on the
// transaction-mutating routes — see CONTEXT.md "rate limiting". One row
// per (user, window); incremented via an atomic Postgres upsert
// (lib/db/queries/rateLimit.ts) so the database arbitrates concurrency
// (CONTEXT.md invariant 9), rather than a check-then-write in JS.
// windowStart is the app-clock window boundary,
// not a request timestamp — see RATE_LIMIT_WINDOW_MS.
export const rateLimitCounters = pgTable(
  "rate_limit_counters",
  {
    userId: text("user_id").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.userId, table.windowStart] })]
);
