ALTER TABLE "ducks" ALTER COLUMN "duck_id" SET DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "flocks" ALTER COLUMN "flock_id" SET DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "message_id" SET DEFAULT uuidv7();--> statement-breakpoint
ALTER TABLE "ponds" ALTER COLUMN "pond_id" SET DEFAULT uuidv7();