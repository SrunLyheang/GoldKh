CREATE TYPE "public"."currency" AS ENUM('USD', 'KHR');--> statement-breakpoint
CREATE TYPE "public"."gold_unit" AS ENUM('chi', 'damlung');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('buy', 'sell');--> statement-breakpoint
CREATE TABLE "price_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"price_per_troy_oz" numeric(12, 4) NOT NULL,
	"source" text NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "transaction_type" NOT NULL,
	"quantity" numeric(12, 4) NOT NULL,
	"unit" "gold_unit" NOT NULL,
	"price_per_unit" numeric(14, 4) NOT NULL,
	"currency" "currency" DEFAULT 'USD' NOT NULL,
	"transaction_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
