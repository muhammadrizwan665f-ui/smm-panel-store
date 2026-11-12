# Noorix SMM — Google Login update

## Included files
- `src/components/auth/GoogleSignInButton.tsx` — reusable Google OAuth button.
- `src/routes/auth.callback.tsx` — callback handler that establishes the Supabase session and redirects to `/dashboard`.
- `APPLY_PATCH.py` — adds the button to existing LoginForm/RegisterForm and updates stale server-side Supabase fallback values.

## Apply
1. Download and extract this ZIP in your project root (the folder containing `package.json`).
2. Copy the included `src` files into the matching `src` folders, merging/replacing when prompted.
3. Run `python APPLY_PATCH.py` from the project root. It modifies the existing LoginForm, RegisterForm and Supabase config fallback values.
4. Run `npm run build`.
5. Commit/push the changes to GitHub. Cloudflare Pages/Workers should then build from the updated branch.

## Important
- Do NOT manually edit `src/routeTree.gen.ts`; TanStack Router generates it from `src/routes/auth.callback.tsx` during the build.
- Google OAuth redirect in the app is `/auth/callback`. Supabase Auth URL Configuration must allow `https://noorixdigitallab.online/auth/callback`.
- The Google provider must remain enabled in Supabase.
- The publishable Supabase key is used in the same way as the existing browser client. Never put Google Client Secret or GitHub Personal Access Tokens in source code.
- Test both `/login` and `/register`, then sign in with a Google account and confirm it reaches `/dashboard`.
