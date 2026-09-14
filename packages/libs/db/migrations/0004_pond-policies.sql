-- Custom SQL migration file, put your code below! --
GRANT SELECT ON ponds TO ducks_svc, flocks_svc, messages_svc, websocket_svc;--> statement-breakpoint
CREATE POLICY ponds_select ON ponds FOR SELECT USING (true);
