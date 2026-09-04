-- Detach orders from a provider (and its services) before the provider row is deleted,
-- so nested referential actions cannot conflict and order history is preserved.
CREATE OR REPLACE FUNCTION public.detach_orders_before_provider_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET provider_id = NULL,
      service_id = NULL
  WHERE provider_id = OLD.id
     OR service_id IN (SELECT id FROM public.services WHERE provider_id = OLD.id);
  RETURN OLD;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.detach_orders_before_provider_delete() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS trg_detach_orders_before_provider_delete ON public.providers;
CREATE TRIGGER trg_detach_orders_before_provider_delete
BEFORE DELETE ON public.providers
FOR EACH ROW EXECUTE FUNCTION public.detach_orders_before_provider_delete();