CREATE TABLE IF NOT EXISTS "driver_presence" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"booking_id" uuid,
	"is_online" boolean DEFAULT false NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "offers" ALTER COLUMN "request_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ALTER COLUMN "slot_id" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "driver_presence_online_seen_idx" ON "driver_presence" ("is_online","last_seen_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "driver_presence_booking_idx" ON "driver_presence" ("booking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "driver_presence_lat_lng_idx" ON "driver_presence" ("latitude","longitude");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "driver_presence" ADD CONSTRAINT "driver_presence_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "driver_presence" ADD CONSTRAINT "driver_presence_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
