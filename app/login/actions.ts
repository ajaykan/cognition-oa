"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/session";

// Demo-only "login". Sets a session cookie holding the selected user id.
// There is no password / real identity provider — see README.
export async function loginAs(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;
  const store = await cookies();
  store.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
