"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/supabase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const rememberedEmail = localStorage.getItem("aetheros_remembered_email");

      if (rememberedEmail) {
        setEmail(rememberedEmail);
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("handleSubmit called");
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      console.log("calling signIn with:", email);
      const { error } = await signIn(email, password);
      console.log("signIn result:", { error });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (rememberMe) {
        localStorage.setItem("aetheros_remembered_email", email);
      } else {
        localStorage.removeItem("aetheros_remembered_email");
      }

      console.log("redirecting to /dashboard");
      router.refresh();
      router.push("/dashboard");
    } catch (error) {
      console.log("caught error:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-6">
        <h1 className="mb-6 text-center text-3xl font-semibold text-[#f9fafb]">
          AetherOS
        </h1>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <label className="flex min-h-11 items-center gap-3 text-sm text-[#9ca3af]">
            <input
              checked={rememberMe}
              className="h-5 w-5 accent-[#6366f1]"
              type="checkbox"
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <span>Remember me</span>
          </label>

          {errorMessage ? (
            <p className="text-sm text-red-400">{errorMessage}</p>
          ) : null}

          <Button
            type="submit"
            className="w-full bg-[#6366f1] text-white hover:bg-[#5558df]"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[#9ca3af]">
          Don&apos;t have an account?{" "}
          <Link className="text-[#6366f1] hover:underline" href="/auth/register">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
