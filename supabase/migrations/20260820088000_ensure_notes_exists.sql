-- The TypeScript error confirms the 'notes' column is NOT recognized by the generated types.
-- Re-applying the migration to ensure the column is definitively in the schema.

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'providers' AND column_name = 'notes') THEN
        ALTER TABLE public.providers ADD COLUMN notes text;
    END IF;
END $$;

GRANT ALL ON public.providers TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
