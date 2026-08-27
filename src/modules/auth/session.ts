import { Elysia } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { getSession, touchSession } from "../../db/valkey";
import { getUserByUuid } from "./auth.service";
import type { User } from "../../db/schema";

export const SESSION_COOKIE = "sid";

type CookieLike = {
  sid?: { value?: string };
};

export function extractToken(
  headers: Record<string, string | undefined>,
  cookieStore?: CookieLike
): string | null {
  const auth = headers["authorization"];
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7).trim() || null;
  }
  const fromCookie = cookieStore?.sid?.value;
  return fromCookie ?? null;
}

async function resolveUser(
  headers: Record<string, string | undefined>,
  cookieStore?: CookieLike
): Promise<{ user: User | null }> {
  const token = extractToken(headers, cookieStore);
  if (!token) return { user: null };

  const userUuid = await getSession(token);
  if (!userUuid) return { user: null };

  const user = await getUserByUuid(userUuid);
  if (!user) return { user: null };

  await touchSession(token);
  return { user };
}

/**
 * Plugin yang men-derive `user` dari Bearer header ATAU cookie `sid`,
 * lalu guard 401 kalau tidak ada session. Route yang memakai ini
 * HARUS didefinisikan di dalam instance yang dikembalikan factory ini
 * (karena di Elysia versi ini, derive dari plugin `.use()` tidak
 * propagate ke route di instance parent).
 */
export function authenticated() {
  return new Elysia()
    .use(cookie())
    .derive(({ headers, cookie }) =>
      resolveUser(
        headers as Record<string, string | undefined>,
        cookie as unknown as CookieLike
      )
    )
    .onBeforeHandle(({ user, set }) => {
      if (!user) {
        set.status = 401;
        return { message: "Unauthorized" };
      }
    });
}
