import {
  boolean,
  date,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Prices are stored in one canonical unit — USD per troy ounce — per
// architecture-context.md. Unit and currency conversion happens at
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
// client. See progress-tracker.md's "User ID always from the server-side
// Clerk session" invariant.
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
