import Redis from "ioredis";

const url = (process.env.REDIS_URL ?? "").replace("valkey://", "redis://");

export const valkey = new Redis(url, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

valkey.on("error", (err) => {
  console.error("❌ Valkey connection error:", err.message);
});

const SESSION_PREFIX = "session:";
export const SESSION_TTL_SECONDS = 60 * 60 * 2; // 2 jam, sliding

const sessionKey = (token: string) => `${SESSION_PREFIX}${token}`;

export async function createSession(token: string, userUuid: string) {
  await valkey.set(sessionKey(token), userUuid, "EX", SESSION_TTL_SECONDS);
}

export async function getSession(token: string): Promise<string | null> {
  return valkey.get(sessionKey(token));
}

export async function touchSession(token: string) {
  await valkey.expire(sessionKey(token), SESSION_TTL_SECONDS);
}

export async function deleteSession(token: string) {
  await valkey.del(sessionKey(token));
}
