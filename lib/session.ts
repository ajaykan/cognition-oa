import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";
import { prisma } from "./db";
import { AppId, canAccessApp } from "./rbac";

export const SESSION_COOKIE = "session_user";

// Returns the logged-in user, or null. This is a demo session: the cookie
// simply holds the user id. No real auth — see README.
export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const userId = store.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

// Require a logged-in user; redirect to login otherwise.
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Require access to a specific tool; redirect away if the role lacks access.
// Enforced server-side so hiding the nav item is never the only guard.
export async function requireAppAccess(appId: AppId): Promise<User> {
  const user = await requireUser();
  if (!canAccessApp(user.role, appId)) redirect("/");
  return user;
}
