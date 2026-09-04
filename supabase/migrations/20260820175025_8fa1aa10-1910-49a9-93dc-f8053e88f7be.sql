
-- Update site_settings to enforce global INR rate
INSERT INTO public.site_settings (key, value, description)
VALUES 
  ('customer_currency', 'INR', 'The active currency for customer pricing'),
  ('usdt_rate', '105', 'Manual USDT exchange rate against the customer currency'),
  ('usdt_to_inr', '105', 'Conversion rate from 1 USDT to INR'),
  ('price_rounding', '2_decimals', 'Default price rounding strategy')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Remove PKR related setting
DELETE FROM public.site_settings WHERE key = 'usdt_to_pkr';

-- Update all existing services to use the new rate
UPDATE public.services 
SET 
  customer_currency = 'INR',
  usdt_rate_at_calculation = 105,
  customer_price = ROUND((CASE 
    WHEN profit_type = 'percentage' THEN (normalized_usdt_cost * 105) * (1 + profit_value / 100)
    ELSE (normalized_usdt_cost * 105) + profit_value
  END)::numeric, 2),
  price_per_1000 = ROUND((CASE 
    WHEN profit_type = 'percentage' THEN (normalized_usdt_cost * 105) * (1 + profit_value / 100)
    ELSE (normalized_usdt_cost * 105) + profit_value
  END)::numeric, 2),
  customer_rate = ROUND((CASE 
    WHEN profit_type = 'percentage' THEN (normalized_usdt_cost * 105) * (1 + profit_value / 100)
    ELSE (normalized_usdt_cost * 105) + profit_value
  END)::numeric, 2),
  converted_cost = ROUND((normalized_usdt_cost * 105)::numeric, 2);

-- Update all providers to default to USDT if they were PKR
UPDATE public.providers SET currency = 'USDT' WHERE currency = 'PKR';
