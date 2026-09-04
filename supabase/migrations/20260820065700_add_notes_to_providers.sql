DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='providers' AND column_name='notes') THEN
        ALTER TABLE public.providers ADD COLUMN notes TEXT;
    END IF;
END $$;
