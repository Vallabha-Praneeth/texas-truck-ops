-- Create proof status enum
DO $$ BEGIN
  CREATE TYPE "proof_status" AS ENUM ('pending_review', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create proof_uploads table
CREATE TABLE IF NOT EXISTS "proof_uploads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "booking_id" uuid NOT NULL,
  "driver_user_id" uuid NOT NULL,
  "image_url" text NOT NULL,
  "latitude" numeric(10, 7),
  "longitude" numeric(10, 7),
  "captured_at" timestamp with time zone NOT NULL,
  "uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
  "notes" text,
  "status" "proof_status" DEFAULT 'pending_review' NOT NULL,
  "reviewed_by" uuid,
  "reviewed_at" timestamp with time zone,
  "rejection_reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "proof_uploads_booking_idx" ON "proof_uploads" ("booking_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "proof_uploads_driver_idx" ON "proof_uploads" ("driver_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "proof_uploads_status_idx" ON "proof_uploads" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "proof_uploads_captured_at_idx" ON "proof_uploads" ("captured_at" DESC);
--> statement-breakpoint

-- Add foreign key constraints
DO $$ BEGIN
  ALTER TABLE "proof_uploads" ADD CONSTRAINT "proof_uploads_booking_id_bookings_id_fk"
    FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "proof_uploads" ADD CONSTRAINT "proof_uploads_driver_user_id_users_id_fk"
    FOREIGN KEY ("driver_user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "proof_uploads" ADD CONSTRAINT "proof_uploads_reviewed_by_users_id_fk"
    FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
