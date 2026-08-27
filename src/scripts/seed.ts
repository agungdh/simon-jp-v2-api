import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { createUser, findUserByUsername } from "../modules/auth/auth.service";

const seedUsers = [
  { username: "admin", password: "admin123", name: "Administrator" },
  { username: "john", password: "password123", name: "John Doe" },
];

async function main() {
  for (const u of seedUsers) {
    const existing = await findUserByUsername(u.username);
    if (existing) {
      console.log(`↪ user "${u.username}" sudah ada, skip`);
      continue;
    }
    const user = await createUser(u);
    console.log(`✓ user "${user.username}" (${user.uuid}) dibuat`);
  }
  console.log("✅ seed selesai");
  await db.$client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ seed gagal:", err);
  process.exit(1);
});
