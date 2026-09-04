DO $$
DECLARE
  v_service_id uuid;
  v_order_id uuid;
  v_user_id uuid;
  v_after uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  IF v_user_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.services (name, price_per_1000) VALUES ('__fk_probe_service__', 10) RETURNING id INTO v_service_id;
  INSERT INTO public.orders (user_id, service_id, link, quantity, price, status)
  VALUES (v_user_id, v_service_id, 'https://example.invalid/p', 100, 1.00, 'completed') RETURNING id INTO v_order_id;

  DELETE FROM public.services WHERE id = v_service_id;

  SELECT service_id INTO v_after FROM public.orders WHERE id = v_order_id;
  RAISE NOTICE 'probe service_id after delete: %', v_after;

  DELETE FROM public.orders WHERE id = v_order_id;
END $$;