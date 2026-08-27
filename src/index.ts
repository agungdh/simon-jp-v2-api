import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { auth } from "./modules/auth/auth";

const app = new Elysia()
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "Simon JP V2 API",
          version: "1.0.0",
        },
      },
    })
  )
  .get("/", () => "Hello Elysia")
  .use(auth)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
