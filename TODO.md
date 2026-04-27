# Real-Time Shop Image Update Implementation

## Status: ✅ COMPLETE

## Goal
When admin uploads a new logo/banner, all connected clients (admin + customers) see the update instantly without refreshing.

## Steps Completed

- [x] 1. Create `SHOP_BRANDING_SQL.md` - SQL for `shop_branding` table, RLS, realtime
- [x] 2. Create `lib/shop-context.tsx` - React context with real-time subscription
- [x] 3. Create `lib/shop-helpers.ts` - Upload image to Supabase Storage + update DB
- [x] 4. Update `app/root-layout-client.tsx` - Wrap app with `<ShopProvider>`
- [x] 5. Update `app/admin/settings-manager.tsx` - Add logo/banner upload UI
- [x] 6. Update `app/layout-client.tsx` - Dynamic logo from context
- [x] 7. Update `app/components/shop-card.tsx` - Dynamic banner from context
- [x] 8. Update `app/dashboard/dashboard-content.tsx` - Dynamic shop image from context

## Next Steps (User Action Required)

1. **Run the SQL** in `SHOP_BRANDING_SQL.md` in your Supabase SQL Editor
2. **Create Storage Bucket**: Go to Supabase Dashboard > Storage > Create public bucket `shop-images`
3. **Enable Realtime**: Database > Replication > Check `shop_branding` for INSERT/UPDATE/DELETE
4. **Test**: Upload a logo/banner from admin dashboard, verify all client tabs update instantly

