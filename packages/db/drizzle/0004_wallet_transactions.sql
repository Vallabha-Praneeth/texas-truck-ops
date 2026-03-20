-- Create transaction type enum
DO $$ BEGIN
  CREATE TYPE "transaction_type" AS ENUM ('deposit', 'withdrawal', 'refund', 'payout', 'platform_fee');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create transaction status enum
DO $$ BEGIN
  CREATE TYPE "transaction_status" AS ENUM ('pending', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS "wallet_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "booking_id" uuid,
  "amount" numeric(12, 2) NOT NULL,
  "type" "transaction_type" NOT NULL,
  "status" "transaction_status" DEFAULT 'pending' NOT NULL,
  "payment_method" varchar(50),
  "external_transaction_id" varchar(255),
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone
);
--> statement-breakpoint

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "wallet_transactions_user_idx" ON "wallet_transactions" ("user_id", "created_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_transactions_booking_idx" ON "wallet_transactions" ("booking_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_transactions_status_idx" ON "wallet_transactions" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_transactions_type_idx" ON "wallet_transactions" ("type");
--> statement-breakpoint

-- Add foreign key constraints
DO $$ BEGIN
  ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_booking_id_bookings_id_fk"
    FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
