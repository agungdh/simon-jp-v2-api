import { Elysia } from "elysia";
import { auth } from "./modules/auth/auth";

const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .use(auth)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
