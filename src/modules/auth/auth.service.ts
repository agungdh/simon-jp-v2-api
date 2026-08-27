import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users, type User } from "../../db/schema";
import { hashPassword, verifyPassword } from "../../lib/password";
import { genToken } from "../../lib/token";
import {
  createSession,
  deleteSession,
  SESSION_TTL_SECONDS,
} from "../../db/valkey";

export async function findUserByUsername(
  username: string
): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username));
  return user ?? null;
}

export async function getUserByUuid(uuid: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.uuid, uuid));
  return user ?? null;
}

export async function createUser(raw: {
  username: string;
  password: string;
  name: string;
}): Promise<User> {
  const hashed = await hashPassword(raw.password);
  const [user] = await db
    .insert(users)
    .values({
      username: raw.username,
      password: hashed,
      name: raw.name,
    })
    .returning();
  return user;
}

export async function login(
  username: string,
  password: string
): Promise<{ token: string; user: User } | null> {
  const user = await findUserByUsername(username);
  if (!user) return null;

  const ok = await verifyPassword(user.password, password);
  if (!ok) return null;

  const token = genToken();
  await createSession(token, user.uuid);

  return { token, user };
}

export async function logout(token: string | null): Promise<void> {
  if (!token) return;
  await deleteSession(token);
}

export { SESSION_TTL_SECONDS };
