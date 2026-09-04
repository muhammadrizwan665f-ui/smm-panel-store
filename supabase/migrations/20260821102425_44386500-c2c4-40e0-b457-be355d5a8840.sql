-- Preserve order history when a service is removed (e.g. via provider cascade delete)
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_service_id_fkey,
ADD CONSTRAINT orders_service_id_fkey
FOREIGN KEY (service_id)
REFERENCES public.services(id)
ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';