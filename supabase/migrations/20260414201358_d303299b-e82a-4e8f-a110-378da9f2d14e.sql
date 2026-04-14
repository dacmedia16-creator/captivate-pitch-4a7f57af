
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _tenant_id uuid;
BEGIN
  -- Try to find the first active tenant to auto-assign
  SELECT id INTO _tenant_id FROM public.tenants WHERE status = 'active' ORDER BY created_at LIMIT 1;

  INSERT INTO public.profiles (id, email, full_name, tenant_id, status)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), _tenant_id, 'active');

  -- Auto-assign broker role to new signups
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'broker');

  RETURN NEW;
END;
$function$;
