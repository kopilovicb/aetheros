"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/supabase/auth";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await signUp(email, password);

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setSuccessMessage("Check your email to confirm your account, then sign in.");
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
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>

          {errorMessage ? (
            <p className="text-sm text-red-400">{errorMessage}</p>
          ) : null}
          {successMessage ? (
            <p className="text-sm text-emerald-400">{successMessage}</p>
          ) : null}

          <Button
            type="submit"
            className="w-full bg-[#6366f1] text-white hover:bg-[#5558df]"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[#9ca3af]">
          Already have an account?{" "}
          <Link className="text-[#6366f1] hover:underline" href="/auth/login">
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}
