DO $$ BEGIN
 CREATE TYPE "booking_status" AS ENUM('pending_deposit', 'confirmed', 'running', 'awaiting_review', 'completed', 'cancelled', 'disputed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "offer_status" AS ENUM('pending', 'countered', 'accepted', 'rejected', 'expired');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "user_role" AS ENUM('operator', 'broker', 'driver', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "availability_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"truck_id" uuid NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"region" text NOT NULL,
	"radius_miles" integer NOT NULL,
	"reposition_allowed" boolean DEFAULT false NOT NULL,
	"max_reposition_miles" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_id" uuid NOT NULL,
	"accepted_offer_id" uuid NOT NULL,
	"operator_org_id" uuid NOT NULL,
	"broker_user_id" uuid NOT NULL,
	"driver_user_id" uuid,
	"status" "booking_status" DEFAULT 'pending_deposit' NOT NULL,
	"amount_cents" integer NOT NULL,
	"deposit_cents" integer NOT NULL,
	"deposit_paid_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_slot_id_unique" UNIQUE("slot_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"slot_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"terms" jsonb,
	"status" "offer_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "org_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "user_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orgs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"type" varchar(20) NOT NULL,
	"contact_phone" varchar(20) NOT NULL,
	"contact_email" varchar(255),
	"tax_id" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" uuid NOT NULL,
	"region" text NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"preferred_start_at" timestamp with time zone NOT NULL,
	"preferred_end_at" timestamp with time zone NOT NULL,
	"budget_cents" integer,
	"min_screen_width_ft" varchar(20),
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trucks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"nickname" varchar(100) NOT NULL,
	"plate_number" varchar(20) NOT NULL,
	"screen_size_ft" varchar(50) NOT NULL,
	"base_region" varchar(100) NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"display_name" varchar(100) NOT NULL,
	"primary_role" "user_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "slots_truck_time_idx" ON "availability_slots" ("truck_id","start_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "slots_region_time_idx" ON "availability_slots" ("region","start_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bookings_slot_unique_idx" ON "bookings" ("slot_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_operator_status_idx" ON "bookings" ("operator_org_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_broker_status_idx" ON "bookings" ("broker_user_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "offers_request_idx" ON "offers" ("request_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "offers_slot_idx" ON "offers" ("slot_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "offers_status_idx" ON "offers" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "org_members_org_idx" ON "org_members" ("org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "org_members_user_idx" ON "org_members" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "org_members_unique_idx" ON "org_members" ("org_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "requests_created_by_idx" ON "requests" ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "requests_status_idx" ON "requests" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "requests_region_idx" ON "requests" ("region");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trucks_org_idx" ON "trucks" ("org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trucks_verified_idx" ON "trucks" ("verified");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_idx" ON "users" ("phone");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_truck_id_trucks_id_fk" FOREIGN KEY ("truck_id") REFERENCES "trucks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_slot_id_availability_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "availability_slots"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_accepted_offer_id_offers_id_fk" FOREIGN KEY ("accepted_offer_id") REFERENCES "offers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_operator_org_id_orgs_id_fk" FOREIGN KEY ("operator_org_id") REFERENCES "orgs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_broker_user_id_users_id_fk" FOREIGN KEY ("broker_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_driver_user_id_users_id_fk" FOREIGN KEY ("driver_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "offers" ADD CONSTRAINT "offers_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "offers" ADD CONSTRAINT "offers_slot_id_availability_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "availability_slots"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "offers" ADD CONSTRAINT "offers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "org_members" ADD CONSTRAINT "org_members_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "orgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "org_members" ADD CONSTRAINT "org_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "requests" ADD CONSTRAINT "requests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trucks" ADD CONSTRAINT "trucks_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "orgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
--> statement-breakpoint
-- Enable btree_gist extension for UUID support in exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
-- Add base_geog column to availability_slots
ALTER TABLE "availability_slots" ADD COLUMN "base_geog" geography(Point, 4326);
--> statement-breakpoint
-- Create GIST index on base_geog for spatial queries
CREATE INDEX IF NOT EXISTS "slots_geog_idx" ON "availability_slots" USING GIST ("base_geog");
--> statement-breakpoint
-- Add exclusion constraint to prevent overlapping slots per truck
-- This ensures no two slots for the same truck can have overlapping time ranges
-- btree_gist extension is required for UUID equality in GIST index
ALTER TABLE "availability_slots" ADD CONSTRAINT "slots_no_overlap_excl" 
  EXCLUDE USING GIST (
    "truck_id" WITH =,
    tstzrange("start_at", "end_at", '[)') WITH &&
  );
