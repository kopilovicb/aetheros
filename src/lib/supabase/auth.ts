import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

type AuthResult<T> = {
  data: T | null;
  error: Error | null;
};

export async function signUp(
  email: string,
  password: string,
): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return {
    data: error ? null : data,
    error: error ? new Error(error.message) : null,
  };
}

export async function signIn(
  email: string,
  password: string,
): Promise<AuthResult<{ user: User; session: Session }>> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    data: error ? null : data,
    error: error ? new Error(error.message) : null,
  };
}

export async function signOut(): Promise<AuthResult<null>> {
  const { error } = await supabase.auth.signOut();
  return {
    data: error ? null : null,
    error: error ? new Error(error.message) : null,
  };
}

export async function getSession(): Promise<AuthResult<Session>> {
  const { data, error } = await supabase.auth.getSession();
  return {
    data: error ? null : data.session,
    error: error ? new Error(error.message) : null,
  };
}

export async function getUser(): Promise<AuthResult<User>> {
  const { data, error } = await supabase.auth.getUser();
  return {
    data: error ? null : data.user,
    error: error ? new Error(error.message) : null,
  };
}
