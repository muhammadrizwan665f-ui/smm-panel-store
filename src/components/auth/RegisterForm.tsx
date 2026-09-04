import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Phone, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { signUp, signIn, completeProfile } from "@/lib/auth/auth.functions";
import { establishClientSession } from "@/lib/auth/client-session";
import { attachReferral } from "@/lib/referrals.functions";

const registerSchema = z.object({
  identifier: z.string().min(3, "Enter a valid mobile number or email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("STARTING_SIGNUP", { identifier: data.identifier });
      const result = await signUp({ 
        data: { 
          identifier: data.identifier, 
          password: data.password,
          confirmPassword: data.confirmPassword
        } 
      });

      if (!result.success) throw new Error(result.error || "Registration failed");

      console.log("SIGNUP_SUCCESS, STARTING_SIGNIN");
      const loginResult = await signIn({ 
        data: { 
          identifier: data.identifier, 
          password: data.password 
        } 
      });
      
      if (!loginResult.success) throw new Error(loginResult.error || "Login failed");

      if (loginResult.session) {
        const established = await establishClientSession({
          access_token: loginResult.session.access_token,
          refresh_token: loginResult.session.refresh_token,
        });

        if (!established) {
          throw new Error("Could not establish a session after registration.");
        }

        console.log("SIGNIN_SUCCESS, COMPLETING_PROFILE");
        await completeProfile();

        try {
          const ref = new URLSearchParams(window.location.search).get("ref");
          if (ref) await attachReferral({ data: { code: ref } });
        } catch (refErr) {
          console.warn("Referral attach failed", refErr);
        }

        console.log("PROFILE_COMPLETE, NAVIGATING_TO_DASHBOARD");
        await navigate({ to: "/dashboard" });
      } else {
        throw new Error("Failed to establish session after registration.");
      }
    } catch (err: any) {
      console.error("REGISTRATION_UI_ERROR:", err);
      let message = "Registration failed. Please try again.";
      if (err.message?.includes("User already registered")) {
        message = "An account with this mobile number already exists.";
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
        <h1 className="text-3xl font-bold text-gradient">Create Account</h1>
        <p className="mt-2 text-muted-foreground">Join our premium SMM panel</p>
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
                id="identifier"
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

          <div className="space-y-1">
            <label className="text-sm font-medium ml-1 text-foreground/80">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary">
                <Lock size={18} />
              </div>
              <input
                {...register("confirmPassword")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="block w-full pl-12 pr-4 py-3.5 bg-secondary/30 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/40 text-foreground"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-destructive ml-1">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in zoom-in-95 duration-200">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isLoading}
          className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl text-sm font-black uppercase tracking-widest text-white gradient-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            "Create Account"
          )}
        </button>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-primary hover:text-primary/80 transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
