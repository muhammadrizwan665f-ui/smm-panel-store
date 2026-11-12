import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Phone, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, useNavigate, useLocation, useSearch, useRouter } from "@tanstack/react-router";
import { signIn, completeProfile } from "@/lib/auth/auth.functions";
import { establishClientSession } from "@/lib/auth/client-session";
import { BUSINESS } from "@/lib/business";
import { AuthField, AUTH_INPUT_CLASS } from "./AuthField";

const loginSchema = z.object({
  identifier: z.string().min(1, "Mobile or email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * `embedded` renders the bare form (no outer card / heading), used inside the
 * tabbed login card on the homepage.
 */
export const LoginForm = ({ embedded = false }: { embedded?: boolean }) => {
  const router = useRouter();
  const loaderData = router.state.matches.find((m: any) => m.routeId === "__root__")
    ?.loaderData as any;
  const brandName = loaderData?.brand_name || "SMM Panel";
  const logoUrl = loaderData?.logo_url;

  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const search = useSearch({ strict: false });

  const isManagement = location.pathname.startsWith("/management");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    console.log("LOGIN_STARTED", { identifier: data.identifier });

    try {
      const result = await signIn({
        data: { identifier: data.identifier, password: data.password },
      });

      if (!result.success || !result.session) {
        throw new Error(result.error || "Login failed: Session not established.");
      }

      const established = await establishClientSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });

      if (!established) {
        throw new Error("Could not establish a session. Please try again.");
      }

      console.log("SUPABASE_SIGNIN_SUCCESS", { user: result.user?.id });

      // Self-healing: backfills email (and mobile_number/role if somehow
      // missing) on the profile row for accounts created before this was
      // tracked. Safe to call every login — it's idempotent and doesn't
      // overwrite existing values with blanks.
      try {
        await completeProfile();
      } catch (syncErr) {
        console.warn("completeProfile sync on login failed (non-blocking)", syncErr);
      }

      const redirectTo = (search as any)?.redirect || (isManagement ? "/management" : "/dashboard");
      console.log("REDIRECTING_TO:", redirectTo);

      await navigate({ to: redirectTo });
    } catch (err: any) {
      console.error("LOGIN_UI_ERROR:", err);
      let message = "Invalid credentials. Please try again.";
      if (err.message?.includes("Invalid login credentials")) {
        message = "Incorrect mobile number or password.";
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={
        embedded ? "w-full" : "w-full max-w-md glass-white p-7 sm:p-9 rounded-[2rem] card-shadow"
      }
    >
      {!embedded && (
      <div className="mb-7">
        {isManagement && logoUrl && (
          <div className="mb-5">
            <img src={logoUrl} alt={brandName} className="h-14 w-auto object-contain" />
          </div>
        )}
        <h1 className="text-3xl font-black tracking-tight text-gradient">
          {isManagement ? brandName : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isManagement ? "Sign in to the admin panel" : `Sign in to your ${BUSINESS.name} account`}
        </p>
      </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <AuthField
          label="Mobile or Email"
          htmlFor="identifier-login"
          icon={Phone}
          error={errors.identifier?.message}
        >
          <input
            id="identifier-login"
            {...register("identifier")}
            type="text"
            autoComplete="username"
            placeholder="03xx xxxxxxx or you@email.com"
            className={AUTH_INPUT_CLASS}
          />
        </AuthField>

        <AuthField
          label="Password"
          htmlFor="password-login"
          icon={Lock}
          error={errors.password?.message}
          right={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        >
          <input
            id="password-login"
            {...register("password")}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Your password"
            className={AUTH_INPUT_CLASS}
          />
        </AuthField>

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in zoom-in-95 duration-200"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-4 px-4 rounded-2xl text-sm font-black uppercase tracking-widest text-white gradient-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Login to Dashboard"}
        </button>

        {/* GOOGLE_LOGIN_SLOT: add an "or" divider + "Continue with Google" button here later. */}

        {!isManagement && !embedded && (
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-bold text-primary hover:text-primary/80 transition-colors"
            >
              Create Account
            </Link>
          </p>
        )}
      </form>
    </div>
  );
};
