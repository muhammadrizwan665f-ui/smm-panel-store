INSERT INTO public.site_settings (key, value, description) VALUES
 ('brand_name', 'SMM Panel', 'Website brand name'),
 ('logo_url', '', 'Brand logo image URL'),
 ('favicon_url', '', 'Favicon image URL'),
 ('whatsapp_number', '', 'WhatsApp support number'),
 ('support_email', '', 'Support email address'),
 ('auto_refund_enabled', 'true', 'Automatically refund users when an order is cancelled or fails')
ON CONFLICT (key) DO NOTHING;