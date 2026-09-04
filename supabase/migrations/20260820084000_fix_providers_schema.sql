-- The E2E test revealed that 'notes' column is missing from 'providers' schema cache.
-- Ensure the column exists and refresh the cache.

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'providers' AND column_name = 'notes') THEN
        ALTER TABLE public.providers ADD COLUMN notes text;
    END IF;
END $$;

-- Grant permissions again to be sure
GRANT ALL ON public.providers TO authenticated;
GRANT ALL ON public.providers TO service_role;

-- Notify postgrest to reload schema cache
NOTIFY pgrst, 'reload schema';
