-- supabase/migrations/0008_set_parent_daycare_on_accept.sql
-- SPEC 09 follow-up: parents activated through an invitation ended up with
-- users.daycare_id = NULL (the signUp metadata carries no daycare), so the
-- "users read staff daycare" RLS policy blocked the staff from reading their
-- profile row and the "PADRES VINCULADOS" panel silently dropped accepted
-- links (the users join returned NULL). Fix in two parts:
--   1. accept_invitation (SECURITY DEFINER) now assigns the parent's
--      users.daycare_id from the invited child's daycare at acceptance time.
--   2. Backfill: parents that already have links get the daycare of their
--      linked children.
-- Note: users.daycare_id is a single column, so a parent with children in
-- several daycares keeps the first assigned one; cross-daycare staff reading
-- such a parent row stays unsupported by the current RLS design.

-- 1. accept_invitation: same contract as 0006, plus the daycare assignment.
-- Children carry no daycare_id — resolve it through the child's room.
CREATE OR REPLACE FUNCTION public.accept_invitation(p_code text, p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_parent_id uuid := (SELECT auth.uid());
  v_invitation public.invitations%ROWTYPE;
  v_daycare_id uuid;
  v_inserted integer;
BEGIN
  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE code = p_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_expired';
  END IF;

  IF v_invitation.status <> 'pending' OR v_invitation.expires_at < now() THEN
    RAISE EXCEPTION 'invalid_or_expired';
  END IF;

  IF lower(trim(v_invitation.email)) <> lower(trim(p_email)) THEN
    RAISE EXCEPTION 'email_mismatch';
  END IF;

  SELECT r.daycare_id INTO v_daycare_id
  FROM public.children c
  JOIN public.rooms r ON r.id = c.room_id
  WHERE c.id = v_invitation.child_id;

  INSERT INTO public.parent_children (parent_id, child_id, relationship)
  VALUES (v_parent_id, v_invitation.child_id, v_invitation.relationship)
  ON CONFLICT (parent_id, child_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 0 THEN
    RAISE EXCEPTION 'already_linked';
  END IF;

  UPDATE public.users
  SET daycare_id = v_daycare_id, updated_at = now()
  WHERE id = v_parent_id;

  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = v_invitation.id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_invitation(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text, text) TO authenticated;

-- 2. Backfill already-linked parents whose daycare_id is still NULL.
UPDATE public.users u
SET daycare_id = backfill.daycare_id, updated_at = now()
FROM (
  SELECT pc.parent_id, (r.daycare_id::text)::uuid AS daycare_id
  FROM public.parent_children pc
  JOIN public.children c ON c.id = pc.child_id
  JOIN public.rooms r ON r.id = c.room_id
  GROUP BY pc.parent_id, (r.daycare_id::text)::uuid
) AS backfill
WHERE u.id = backfill.parent_id
  AND u.daycare_id IS NULL;
