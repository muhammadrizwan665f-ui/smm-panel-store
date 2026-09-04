-- Integration test: deleting a provider preserves order history with provider_id NULL
DO $$
DECLARE
  v_provider_id uuid;
  v_service_id uuid;
  v_order_id uuid;
  v_user_id uuid;
  v_remaining int;
  v_provider_after uuid;
  v_services_after int;
  v_name_after text;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'SKIP: no auth users available';
    RETURN;
  END IF;

  INSERT INTO public.providers (name, api_url, api_key)
  VALUES ('__fk_test_provider__', 'https://example.invalid/api/v2', 'test-key')
  RETURNING id INTO v_provider_id;

  INSERT INTO public.services (name, price_per_1000, provider_id, provider_service_id)
  VALUES ('__fk_test_service__', 10, v_provider_id, 'test-1')
  RETURNING id INTO v_service_id;

  INSERT INTO public.orders (user_id, service_id, provider_id, link, quantity, price, service_name, status)
  VALUES (v_user_id, v_service_id, v_provider_id, 'https://example.invalid/post', 100, 1.00, '__fk_test_service__', 'completed')
  RETURNING id INTO v_order_id;

  DELETE FROM public.providers WHERE id = v_provider_id;

  SELECT count(*) INTO v_remaining FROM public.orders WHERE id = v_order_id;
  IF v_remaining <> 1 THEN
    RAISE EXCEPTION 'FAIL: order history was deleted with the provider';
  END IF;

  SELECT provider_id, service_name INTO v_provider_after, v_name_after FROM public.orders WHERE id = v_order_id;
  IF v_provider_after IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: order.provider_id not NULL (got %)', v_provider_after;
  END IF;
  IF v_name_after <> '__fk_test_service__' THEN
    RAISE EXCEPTION 'FAIL: order history fields lost (service_name=%)', v_name_after;
  END IF;

  SELECT count(*) INTO v_services_after FROM public.services WHERE id = v_service_id;
  IF v_services_after <> 0 THEN
    RAISE EXCEPTION 'FAIL: service not cascade-deleted with provider';
  END IF;

  DELETE FROM public.orders WHERE id = v_order_id;
  RAISE NOTICE 'PASS: provider delete keeps order history with provider_id NULL';
END $$;