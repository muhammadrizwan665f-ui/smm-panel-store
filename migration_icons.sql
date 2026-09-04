ALTER TABLE public.services ADD COLUMN IF NOT EXISTS icon TEXT;

-- Grant permissions (if needed, though already granted for services usually)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
