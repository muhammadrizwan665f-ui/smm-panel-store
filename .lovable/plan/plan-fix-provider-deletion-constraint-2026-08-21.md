# Plan: Fix Provider Deletion Constraint

Fix the foreign key violation when deleting a provider by ensuring all associated records (orders and services) are either deleted or handled appropriately.

## User Review Required

> [!IMPORTANT]
> When a provider is deleted, should the associated orders be deleted as well, or should they be kept for historical purposes? The current plan assumes we should keep orders but detach them from the deleted provider (setting `provider_id` to NULL), while services (which are unique to a provider) will be deleted.

## Proposed Changes

### Database Schema (Migrations)

#### Fix Foreign Key Constraints
- Modify the `orders` table's foreign key constraint on `provider_id` to `ON DELETE SET NULL` or `ON DELETE CASCADE`.
- Modify the `services` table's foreign key constraint on `provider_id` to `ON DELETE CASCADE` (since services cannot exist without a provider).

### Backend Changes

#### Provider Management
- Ensure the delete operation in `src/lib/providers/management.functions.ts` handles the cascading effects or dependencies correctly if not handled by the database.

## Technical Details

### SQL Migration
```sql
-- Fix orders foreign key
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_provider_id_fkey,
ADD CONSTRAINT orders_provider_id_fkey 
FOREIGN KEY (provider_id) 
REFERENCES public.providers(id) 
ON DELETE SET NULL;

-- Fix services foreign key
ALTER TABLE public.services 
DROP CONSTRAINT IF EXISTS services_provider_id_fkey,
ADD CONSTRAINT services_provider_id_fkey 
FOREIGN KEY (provider_id) 
REFERENCES public.providers(id) 
ON DELETE CASCADE;

-- Also check provider_services if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_services') THEN
        ALTER TABLE public.provider_services 
        DROP CONSTRAINT IF EXISTS provider_services_provider_id_fkey,
        ADD CONSTRAINT provider_services_provider_id_fkey 
        FOREIGN KEY (provider_id) 
        REFERENCES public.providers(id) 
        ON DELETE CASCADE;
    END IF;
END $$;
```

### Affected Files
- `supabase/migrations/<timestamp>_fix_provider_delete_constraint.sql`
- `src/routes/management.index.tsx` (Remove the instruction text once verified)
