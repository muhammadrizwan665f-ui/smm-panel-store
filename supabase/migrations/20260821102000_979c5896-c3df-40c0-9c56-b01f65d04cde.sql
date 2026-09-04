-- Fix orders foreign key to allow deleting providers while keeping historical orders
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_provider_id_fkey,
ADD CONSTRAINT orders_provider_id_fkey 
FOREIGN KEY (provider_id) 
REFERENCES public.providers(id) 
ON DELETE SET NULL;

-- Fix services foreign key to cascade delete when provider is removed
ALTER TABLE public.services 
DROP CONSTRAINT IF EXISTS services_provider_id_fkey,
ADD CONSTRAINT services_provider_id_fkey 
FOREIGN KEY (provider_id) 
REFERENCES public.providers(id) 
ON DELETE CASCADE;

-- Check and fix provider_services table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_services' AND table_schema = 'public') THEN
        ALTER TABLE public.provider_services 
        DROP CONSTRAINT IF EXISTS provider_services_provider_id_fkey,
        ADD CONSTRAINT provider_services_provider_id_fkey 
        FOREIGN KEY (provider_id) 
        REFERENCES public.providers(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';