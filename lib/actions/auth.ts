"use server";

import { redirect } from "next/navigation";
import { appUrl } from "@/lib/app-url";
import { sendWelcomeEmail } from "@/lib/actions/email";
import { getFirstName } from "@/lib/email/utils";
import { ensureUserProfile } from "@/lib/supabase/profile";
import { getPlan } from "@/lib/supabase/getPlan";
import { createClient } from "@/lib/supabase/server";

function redirectWithError(path: string, message: string): never {
  const params = new URLSearchParams({ error: message });
  redirect(`${path}?${params.toString()}`);
}

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    redirectWithError("/login", "Email and password are required.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirectWithError("/login", error.message);
  }

  if (data.user) {
    await ensureUserProfile(supabase, data.user);
    await getPlan(data.user.id);
  }

  redirect("/dashboard");
}

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    redirectWithError("/signup", "Email and password are required.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirectWithError("/signup", error.message);
  }

  if (data.user) {
    await ensureUserProfile(supabase, data.user);
    await getPlan(data.user.id);

    const firstName = getFirstName(
      typeof data.user.user_metadata?.full_name === "string"
        ? data.user.user_metadata.full_name
        : null,
      data.user.email ?? email
    );

    sendWelcomeEmail({
      email: data.user.email ?? email,
      firstName,
    }).catch((err) => console.error("[Email] Welcome email failed:", err));
  }

  redirect("/dashboard");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: appUrl("/auth/callback"),
    },
  });

  if (error) {
    redirectWithError("/login", error.message);
  }

  if (data.url) {
    redirect(data.url);
  }

  redirectWithError("/login", "Could not start Google sign-in.");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
