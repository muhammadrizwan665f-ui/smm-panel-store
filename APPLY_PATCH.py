from pathlib import Path

def patch(path: str, old: str, new: str):
    p = Path(path)
    s = p.read_text(encoding="utf-8")
    if new in s:
        print(f"Already patched: {path}")
        return
    if old not in s:
        raise SystemExit(f"Expected insertion point not found in {path}; no change made to this file.")
    p.write_text(s.replace(old, new, 1), encoding="utf-8")
    print(f"Updated: {path}")

patch(
    "src/components/auth/LoginForm.tsx",
    'import { AuthField, AUTH_INPUT_CLASS } from "./AuthField";',
    'import { AuthField, AUTH_INPUT_CLASS } from "./AuthField";\nimport { GoogleSignInButton } from "./GoogleSignInButton";'
)
patch(
    "src/components/auth/LoginForm.tsx",
    '        {/* GOOGLE_LOGIN_SLOT: add an "or" divider + "Continue with Google" button here later. */}',
    '        {!isManagement && <GoogleSignInButton />}'
)
patch(
    "src/components/auth/RegisterForm.tsx",
    'import { AuthField, AUTH_INPUT_CLASS } from "./AuthField";',
    'import { AuthField, AUTH_INPUT_CLASS } from "./AuthField";\nimport { GoogleSignInButton } from "./GoogleSignInButton";'
)
patch(
    "src/components/auth/RegisterForm.tsx",
    '        {/* GOOGLE_LOGIN_SLOT: add an "or" divider + "Continue with Google" button here later. */}',
    '        <GoogleSignInButton />'
)

# Point server-side fallbacks at the same Supabase project used by the browser client.
old_url = "https://owlbeyryintvqaykodxs.supabase.co"
new_url = "https://mhyphzgzfijhjvptferr.supabase.co"
old_key = "sb_publishable_t8tESVD5AZkds6n6Pd1Oqg_5CuktjKc"
new_key = "sb_publishable_ygB7P-HWTgI98Bs1xNUbYg_iiIx_hCb"

for name in [
    "src/lib/auth/client-session.ts",
    "src/lib/auth/session.functions.ts",
    "src/lib/auth/auth.functions.ts",
    "src/integrations/supabase/auth-middleware.ts",
]:
    p = Path(name)
    s = p.read_text(encoding="utf-8")
    s = s.replace(old_url, new_url).replace(old_key, new_key)
    p.write_text(s, encoding="utf-8")
    print(f"Checked Supabase fallback config: {name}")
