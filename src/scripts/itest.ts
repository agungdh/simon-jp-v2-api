import { Elysia } from "elysia";
import { auth } from "../modules/auth/auth";
import { valkey } from "../db/valkey";
import { db } from "../db";

const app = new Elysia().use(auth);

async function call(
  method: string,
  path: string,
  opts: { body?: unknown; token?: string; cookie?: string } = {}
) {
  const headers: Record<string, string> = {};
  if (opts.body) headers["content-type"] = "application/json";
  if (opts.token) headers["authorization"] = `Bearer ${opts.token}`;
  if (opts.cookie) headers["cookie"] = opts.cookie;
  const res = await app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    })
  );
  const setCookie = res.headers.get("set-cookie");
  let data: any = null;
  try {
    data = await res.json();
  } catch {}
  return { status: res.status, data, setCookie };
}

async function main() {
  // 1. login sukses
  const login = await call("POST", "/auth/login", {
    body: { username: "admin", password: "admin123" },
  });
  console.log("[login] status", login.status, "body", login.data);
  if (login.status !== 200) throw new Error("login gagal");
  const token = login.data.token;
  const cookie = login.setCookie?.split(";")[0]; // sid=...

  // 2. /me dengan bearer
  const meBearer = await call("GET", "/auth/me", { token });
  console.log("[me/bearer] status", meBearer.status, "body", meBearer.data);
  if (meBearer.status !== 200) throw new Error("me bearer gagal");

  // 3. /me tanpa auth -> 401
  const meNo = await call("GET", "/auth/me");
  console.log("[me/noauth] status", meNo.status, "(expect 401)");

  // 4. /me dengan cookie
  const meCookie = await call("GET", "/auth/me", { cookie });
  console.log("[me/cookie] status", meCookie.status, "body", meCookie.data);
  if (meCookie.status !== 200) throw new Error("me cookie gagal");

  // 5. bad login -> 401
  const bad = await call("POST", "/auth/login", {
    body: { username: "admin", password: "salah" },
  });
  console.log("[login/salah] status", bad.status, "(expect 401)");

  // 6. logout lalu /me -> 401
  const out = await call("POST", "/auth/logout", { token });
  console.log("[logout] status", out.status, "body", out.data);
  const meAfter = await call("GET", "/auth/me", { token });
  console.log("[me/after-logout] status", meAfter.status, "(expect 401)");

  console.log("\n✅ ALL CHECKS DONE");
}

main()
  .catch((e) => {
    console.error("❌ TEST ERROR:", e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await valkey.quit();
    await db.$client.end();
    process.exit(process.exitCode ?? 0);
  });
