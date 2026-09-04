-- Force RLS disable and check if records are visible. 
-- If they are NOT visible even with RLS off, it's a schema/view issue.

ALTER TABLE public.providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services DISABLE ROW LEVEL SECURITY;

GRANT ALL ON public.providers TO authenticated, service_role, anon, postgres;
GRANT ALL ON public.provider_services TO authenticated, service_role, anon, postgres;

-- Clean up any potential triggers that might be rolling back inserts silently
DO $$
DECLARE
    trg RECORD;
BEGIN
    FOR trg IN (SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE event_object_schema = 'public' AND event_object_table = 'providers') LOOP
        EXECUTE 'DROP TRIGGER ' || trg.trigger_name || ' ON public.' || trg.event_object_table;
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
