CREATE TABLE "ducks" (
	"duck_id" uuid PRIMARY KEY NOT NULL,
	"pond_id" uuid NOT NULL,
	"google_subject" text NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ducks_pond_id_google_subject_unique" UNIQUE("pond_id","google_subject"),
	CONSTRAINT "ducks_pond_id_display_name_unique" UNIQUE("pond_id","display_name")
);
--> statement-breakpoint
CREATE TABLE "flocks" (
	"flock_id" uuid PRIMARY KEY NOT NULL,
	"pond_id" uuid NOT NULL,
	"name" text NOT NULL,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "flocks_pond_id_name_unique" UNIQUE("pond_id","name")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"flock_id" uuid NOT NULL,
	"duck_id" uuid NOT NULL,
	"pond_id" uuid NOT NULL,
	"added_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_flock_id_duck_id_pk" PRIMARY KEY("flock_id","duck_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"message_id" uuid PRIMARY KEY NOT NULL,
	"pond_id" uuid NOT NULL,
	"flock_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "body_length" CHECK (char_length("messages"."body") <= 4000)
);
--> statement-breakpoint
CREATE TABLE "ponds" (
	"pond_id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ducks" ADD CONSTRAINT "ducks_pond_id_ponds_pond_id_fk" FOREIGN KEY ("pond_id") REFERENCES "public"."ponds"("pond_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flocks" ADD CONSTRAINT "flocks_pond_id_ponds_pond_id_fk" FOREIGN KEY ("pond_id") REFERENCES "public"."ponds"("pond_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flocks" ADD CONSTRAINT "flocks_owner_id_ducks_duck_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."ducks"("duck_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_flock_id_flocks_flock_id_fk" FOREIGN KEY ("flock_id") REFERENCES "public"."flocks"("flock_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_duck_id_ducks_duck_id_fk" FOREIGN KEY ("duck_id") REFERENCES "public"."ducks"("duck_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_pond_id_ponds_pond_id_fk" FOREIGN KEY ("pond_id") REFERENCES "public"."ponds"("pond_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_added_by_ducks_duck_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."ducks"("duck_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_pond_id_ponds_pond_id_fk" FOREIGN KEY ("pond_id") REFERENCES "public"."ponds"("pond_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_flock_id_flocks_flock_id_fk" FOREIGN KEY ("flock_id") REFERENCES "public"."flocks"("flock_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_ducks_duck_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."ducks"("duck_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "memberships_duck_id_flock_id_index" ON "memberships" USING btree ("duck_id","flock_id");--> statement-breakpoint
CREATE INDEX "messages_flock_id_message_id_index" ON "messages" USING btree ("flock_id","message_id");