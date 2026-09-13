-- Roles. One per service, IAM authenticated, no password.
CREATE ROLE ducks_svc LOGIN;--> statement-breakpoint
CREATE ROLE flocks_svc LOGIN;--> statement-breakpoint
CREATE ROLE messages_svc LOGIN;--> statement-breakpoint
CREATE ROLE websocket_svc LOGIN;--> statement-breakpoint
GRANT rds_iam TO ducks_svc;--> statement-breakpoint
GRANT rds_iam TO flocks_svc;--> statement-breakpoint
GRANT rds_iam TO messages_svc;--> statement-breakpoint
GRANT rds_iam TO websocket_svc;--> statement-breakpoint

-- Schema access and table grants (data-model.md, Roles and grants).
GRANT USAGE ON SCHEMA public TO ducks_svc, flocks_svc, messages_svc, websocket_svc;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON ducks TO ducks_svc;--> statement-breakpoint
GRANT SELECT ON ducks TO flocks_svc, messages_svc;--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON flocks TO flocks_svc;--> statement-breakpoint
GRANT SELECT, INSERT ON memberships TO flocks_svc;--> statement-breakpoint
GRANT SELECT ON memberships TO messages_svc, websocket_svc;--> statement-breakpoint
GRANT SELECT, INSERT ON messages TO messages_svc;--> statement-breakpoint

-- Membership and ownership checks. SECURITY DEFINER runs as the table owner,
-- so reading memberships here does not recurse into the memberships policy.
CREATE FUNCTION is_member(p_flock_id uuid, p_duck_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
RETURN EXISTS (
  SELECT 1 FROM memberships m
  WHERE m.flock_id = p_flock_id AND m.duck_id = p_duck_id
);
--> statement-breakpoint
CREATE FUNCTION is_owner(p_flock_id uuid, p_duck_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
RETURN EXISTS (
  SELECT 1 FROM flocks f
  WHERE f.flock_id = p_flock_id AND f.owner_id = p_duck_id
);
--> statement-breakpoint

-- Row-level security. ENABLE, not FORCE: the owner stays exempt so flock delete cascades run.
ALTER TABLE ponds ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE ducks ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE flocks ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- ducks
CREATE POLICY ducks_select ON ducks FOR SELECT
USING (pond_id = current_setting('app.pond_id')::uuid);
--> statement-breakpoint
CREATE POLICY ducks_insert ON ducks FOR INSERT
WITH CHECK (pond_id = current_setting('app.pond_id')::uuid AND google_subject = NULLIF(current_setting('app.google_subject'), ''));
--> statement-breakpoint
CREATE POLICY ducks_update ON ducks FOR UPDATE
USING (pond_id = current_setting('app.pond_id')::uuid AND google_subject = NULLIF(current_setting('app.google_subject'), ''))
WITH CHECK (pond_id = current_setting('app.pond_id')::uuid AND google_subject = NULLIF(current_setting('app.google_subject'), ''));
--> statement-breakpoint

-- flocks
CREATE POLICY flocks_select ON flocks FOR SELECT
USING (pond_id = current_setting('app.pond_id')::uuid AND is_member(flock_id, current_setting('app.duck_id')::uuid));
--> statement-breakpoint
CREATE POLICY flocks_insert ON flocks FOR INSERT
WITH CHECK (pond_id = current_setting('app.pond_id')::uuid AND owner_id = current_setting('app.duck_id')::uuid);
--> statement-breakpoint
CREATE POLICY flocks_delete ON flocks FOR DELETE
USING (pond_id = current_setting('app.pond_id')::uuid AND is_owner(flock_id, current_setting('app.duck_id')::uuid));
--> statement-breakpoint

-- memberships. The two INSERT policies are permissive: either one admits the row.
CREATE POLICY memberships_select ON memberships FOR SELECT
USING (pond_id = current_setting('app.pond_id')::uuid AND is_member(flock_id, current_setting('app.duck_id')::uuid));
--> statement-breakpoint
CREATE POLICY memberships_insert_create_flock ON memberships FOR INSERT
WITH CHECK (
  pond_id = current_setting('app.pond_id')::uuid
  AND added_by = current_setting('app.duck_id')::uuid
  AND duck_id = current_setting('app.duck_id')::uuid
  AND is_owner(flock_id, current_setting('app.duck_id')::uuid)
);
--> statement-breakpoint
CREATE POLICY memberships_insert_add_member ON memberships FOR INSERT
WITH CHECK (
  pond_id = current_setting('app.pond_id')::uuid
  AND added_by = current_setting('app.duck_id')::uuid
  AND is_member(flock_id, current_setting('app.duck_id')::uuid)
);
--> statement-breakpoint

-- messages
CREATE POLICY messages_select ON messages FOR SELECT
USING (pond_id = current_setting('app.pond_id')::uuid AND is_member(flock_id, current_setting('app.duck_id')::uuid));
--> statement-breakpoint
CREATE POLICY messages_insert ON messages FOR INSERT
WITH CHECK (
  pond_id = current_setting('app.pond_id')::uuid
  AND sender_id = current_setting('app.duck_id')::uuid
  AND is_member(flock_id, current_setting('app.duck_id')::uuid)
);
