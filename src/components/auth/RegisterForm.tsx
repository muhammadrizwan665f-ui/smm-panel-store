
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Phone, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { signUp, signIn, completeProfile } from "@/lib/auth/auth.functions";
import { establishClientSession } from "@/lib/auth/client-session";
import { attachReferral } from "@/lib/referrals.functions";
import { AuthField, AUTH_INPUT_CLASS } from "./AuthField";
import { GoogleSignInButton } from "./GoogleSignInButton";

const registerSchema = z
  .object({
    identifier: z.string().min(3, "Enter a valid mobile number or email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password is required"),
    acceptTerms: z.boolean().refine((v) => v === true, {
      message: "You must accept the Terms & Conditions and Privacy Policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm({ embedded = false }: { embedded?: boolean }) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      identifier: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const acceptedTerms = watch("acceptTerms");

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("STARTING_SIGNUP", { identifier: data.identifier });

      const result = await signUp({
        data: {
          identifier: data.identifier,
          password: data.password,
          confirmPassword: data.confirmPassword,
        },
      });

      if (!result.success) {
        throw new Error(result.error || "Registration failed");
      }

      console.log("SIGNUP_SUCCESS, STARTING_SIGNIN");

      const loginResult = await signIn({
        data: {
          identifier: data.identifier,
          password: data.password,
        },
      });

      if (!loginResult.success) {
        throw new Error(loginResult.error || "Login failed");
      }

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
          if (ref) {
            await attachReferral({ data: { code: ref } });
          }
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
    <div
      className={
        embedded
          ? "w-full"
          : "w-full max-w-md glass-white p-7 sm:p-9 rounded-[2rem] card-shadow"
      }
    >
      {!embedded && (
        <div className="mb-7">
          <h1 className="text-3xl font-black tracking-tight text-gradient">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign up in under a minute and start ordering.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <AuthField
          label="Mobile or Email"
          htmlFor="identifier"
          icon={Phone}
          error={errors.identifier?.message}
        >
          <input
            id="identifier"
            {...register("identifier")}
            type="text"
            autoComplete="username"
            placeholder="03xx xxxxxxx or you@email.com"
            className={AUTH_INPUT_CLASS}
          />
        </AuthField>

        <AuthField
          label="Password"
          htmlFor="password"
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
            id="password"
            {...register("password")}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className={AUTH_INPUT_CLASS}
          />
        </AuthField>

        <AuthField
          label="Confirm Password"
          htmlFor="confirmPassword"
          icon={Lock}
          error={errors.confirmPassword?.message}
        >
          <input
            id="confirmPassword"
            {...register("confirmPassword")}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repeat your password"
            className={AUTH_INPUT_CLASS}
          />
        </AuthField>

        <div className="space-y-1.5">
          <label className="flex items-start gap-3 cursor-pointer text-sm text-muted-foreground leading-relaxed">
            <input
              type="checkbox"
              {...register("acceptTerms")}
              className="mt-1 h-4 w-4 rounded border-border accent-[var(--primary)] shrink-0"
            />

            <span>
              I agree to the{" "}
              <a
                href="/terms-and-conditions"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary"
              >
                Terms &amp; Conditions
              </a>
              ,{" "}
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary"
              >
                Privacy Policy
              </a>{" "}
              and{" "}
              <a
                href="/refund-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary"
              >
                Refund Policy
              </a>
              .
            </span>
          </label>

          {errors.acceptTerms && (
            <p className="text-xs text-destructive ml-7">
              {errors.acceptTerms.message}
            </p>
          )}
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
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            "Create Account"
          )}
        </button>

        <GoogleSignInButton disabled={!acceptedTerms} />

        {!acceptedTerms && (
          <p className="text-center text-xs text-muted-foreground">
            Accept the Terms &amp; Conditions and policies above to continue with Google.
          </p>
        )}

        {!embedded && (
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-primary hover:text-primary/80 transition-colors"
            >
              Sign In
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}
