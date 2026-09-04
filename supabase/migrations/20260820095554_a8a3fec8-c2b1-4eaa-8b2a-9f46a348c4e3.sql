ALTER TABLE public.provider_services
  ALTER COLUMN provider_min TYPE bigint,
  ALTER COLUMN provider_max TYPE bigint;

ALTER TABLE public.services
  ALTER COLUMN min_quantity TYPE bigint,
  ALTER COLUMN max_quantity TYPE bigint;