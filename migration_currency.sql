-- Seed default currency settings
INSERT INTO public.site_settings (key, value, description)
VALUES 
  ('usdt_to_inr', '100', 'Conversion rate from 1 USDT to INR'),
  ('usdt_to_pkr', '290', 'Conversion rate from 1 USDT to PKR'),
  ('provider_currency', 'INR', 'Default provider currency')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, description = EXCLUDED.description;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
