 --RUN AFTER existing supabase-schema.sql. --REVIEW existing student statuses before production.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rejection_reason text;
CREATE TABLE IF NOT EXISTS public.faculty_admins (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 role text NOT NULL CHECK(role IN ('super_admin','faculty_admin')),
 faculty text,
 CHECK ((role='super_admin' AND faculty IS NULL) OR (role='faculty_admin' AND faculty IS NOT NULL))
);
ALTER TABLE public.faculty_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.faculty_admins FROM anon, authenticated;
GRANT SELECT ON public.faculty_admins TO authenticated;
DROP POLICY IF EXISTS "Admins can read own role" ON public.faculty_admins;
CREATE POLICY "Admins can read own role" ON public.faculty_admins FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE TABLE IF NOT EXISTS public.profile_approval_log (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 student_id uuid NOT NULL REFERENCES auth.users(id),
 admin_id uuid NOT NULL REFERENCES auth.users(id),
 decision text NOT NULL CHECK(decision IN ('approved','rejected')),
 reason text,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profile_approval_log ENABLE ROW LEVEL SECURITY;
-- Prevent a profile owner from changing approval fields through direct updates.
CREATE OR REPLACE FUNCTION public.protect_profile_approval() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF NEW.approval_status IS DISTINCT FROM OLD.approval_status OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
   IF current_setting('app.profile_review',true) IS DISTINCT FROM 'allowed' THEN RAISE EXCEPTION 'Approval fields cannot be edited directly'; END IF;
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS protect_profile_approval ON public.profiles;
CREATE TRIGGER protect_profile_approval BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_approval();
CREATE OR REPLACE FUNCTION public.review_profile_request(p_student_id uuid,p_decision text,p_reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a public.faculty_admins%ROWTYPE; target_faculty text;
BEGIN
 SELECT * INTO a FROM public.faculty_admins WHERE user_id=auth.uid();
 IF a.user_id IS NULL THEN RAISE EXCEPTION 'Administrator access required'; END IF;
 IF p_decision NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
 IF p_decision='rejected' AND nullif(btrim(p_reason),'') IS NULL THEN RAISE EXCEPTION 'Rejection reason required'; END IF;
 SELECT faculty INTO target_faculty FROM public.profiles WHERE id=p_student_id AND approval_status='pending' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'No pending request'; END IF;
 IF a.role<>'super_admin' AND a.faculty IS DISTINCT FROM target_faculty THEN RAISE EXCEPTION 'Wrong faculty'; END IF;
 PERFORM set_config('app.profile_review','allowed',true);
 UPDATE public.profiles SET approval_status=p_decision,reviewed_by=auth.uid(),reviewed_at=now(),rejection_reason=CASE WHEN p_decision='rejected' THEN p_reason ELSE NULL END WHERE id=p_student_id;
 INSERT INTO public.profile_approval_log(student_id,admin_id,decision,reason) VALUES(p_student_id,auth.uid(),p_decision,p_reason);
END; $$;
REVOKE ALL ON FUNCTION public.review_profile_request(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_profile_request(uuid,text,text) TO authenticated;
-- Restrict profile reads: anonymous users only see approved profiles; owners see their own.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Approved profiles or own" ON public.profiles FOR SELECT USING (approval_status='approved' OR id=auth.uid());
-- Admin read scope, evaluated without recursive profile policies.
CREATE OR REPLACE FUNCTION public.can_admin_read_faculty(p_faculty text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.faculty_admins a WHERE a.user_id=auth.uid() AND (a.role='super_admin' OR (a.role='faculty_admin' AND a.faculty=p_faculty))); $$;
REVOKE ALL ON FUNCTION public.can_admin_read_faculty(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_admin_read_faculty(text) TO authenticated;
CREATE POLICY "Admins read assigned faculty" ON public.profiles FOR SELECT TO authenticated USING (public.can_admin_read_faculty(faculty));
-- Existing insert and update policies must be reviewed for data privacy and additional protected columns.
-- Replace overly broad content-write policies for the tables in the original schema.
CREATE OR REPLACE FUNCTION public.is_approved_student() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND approval_status='approved'); $$;
REVOKE ALL ON FUNCTION public.is_approved_student() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_approved_student() TO authenticated;
-- IMPORTANT: apply is_approved_student() to every write policy across all project tables and storage buckets.
-- The migration intentionally does not guess every table's columns or overwrite uninspected policies.
-- Bootstrap the first super admin manually using a trusted SQL editor, after creating their Auth account:
-- INSERT INTO public.faculty_admins(user_id,role,faculty) VALUES ('YOUR_AUTH_USER_UUID','super_admin',NULL);
