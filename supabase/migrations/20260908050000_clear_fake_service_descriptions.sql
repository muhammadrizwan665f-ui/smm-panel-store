-- Services imported before this fix got a fake placeholder description
-- like "Watchtime — provider service #14384" instead of the real provider
-- description (which wasn't being captured at sync time — see the code
-- fix alongside this migration). Strip that placeholder pattern so
-- customers stop seeing raw provider IDs; a re-sync + re-import will fill
-- in the real description afterwards.
UPDATE public.services
SET description = NULL
WHERE description ~ '— provider service #\d+$';
