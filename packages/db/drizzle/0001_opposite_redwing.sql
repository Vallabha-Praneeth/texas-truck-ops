ALTER TABLE "availability_slots" ADD COLUMN "is_booked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "availability_slots" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;