import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Phone, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, useNavigate, useLocation, useSearch, useRouter } from "@tanstack/react-router";
import { signIn } from "@/lib/auth/auth.functions";
import { establishClientSession } from "@/lib/auth/client-session";

const loginSchema = z.object({
  identifier: z.string().min(1, "Mobile or email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const router = useRouter();
  const loaderData = router.state.matches.find((m: any) => m.routeId === '__root__')?.loaderData as any;
  const brandName = loaderData?.brand_name || "SMM Panel";
  const logoUrl = loaderData?.logo_url;

  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const search = useSearch({ strict: false });

  const isManagement = location.pathname.startsWith('/management');

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
      const result = await signIn({ data: { identifier: data.identifier, password: data.password } });

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
    <div className="w-full max-w-md space-y-8 glass-white p-8 rounded-3xl card-shadow">
      <div className="text-center">
        {logoUrl && (
          <div className="flex justify-center mb-6">
            <img src={logoUrl} alt={brandName} className="h-16 w-auto object-contain" />
          </div>
        )}
        <h1 className="text-3xl font-bold text-gradient">{brandName}</h1>
        <p className="mt-2 text-muted-foreground">Sign in to your account</p>
      </div>

      <div className="mt-8 space-y-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium ml-1 text-foreground/80">Mobile or Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary">
                <Phone size={18} />
              </div>
              <input
                id="identifier-login"
                {...register("identifier")}
                type="text"
                placeholder="Mobile number or Email"
                className="block w-full pl-12 pr-4 py-3.5 bg-secondary/30 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/40 text-foreground"
              />
            </div>
            {errors.identifier && (
              <p className="mt-1 text-xs text-destructive ml-1">{errors.identifier.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium ml-1 text-foreground/80">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary">
                <Lock size={18} />
              </div>
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="block w-full pl-12 pr-12 py-3.5 bg-secondary/30 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/40 text-foreground"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-destructive ml-1">{errors.password.message}</p>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in zoom-in-95 duration-200">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end">
          <Link
            to="/"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isLoading}
          className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl text-sm font-black uppercase tracking-widest text-white gradient-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            "Login to Dashboard"
          )}
        </button>

        {!isManagement && (
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-primary hover:text-primary/80 transition-colors"
              >
                Create Account
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
