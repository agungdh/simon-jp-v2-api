import { randomBytes } from "crypto";

export function genToken(): string {
  return randomBytes(32).toString("hex");
}
