CREATE TABLE "rate_limit_counters" (
	"user_id" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limit_counters_user_id_window_start_pk" PRIMARY KEY("user_id","window_start")
);
