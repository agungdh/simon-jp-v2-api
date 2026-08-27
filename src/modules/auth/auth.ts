import { Elysia } from "elysia";
import { cookie } from "@elysiajs/cookie";
import {
  LoginDto,
  LoginResponseDto,
  UserPublicDto,
  MessageDto,
} from "./auth.dto";
import { login, logout, SESSION_TTL_SECONDS } from "./auth.service";
import { SESSION_COOKIE, extractToken, authenticated } from "./session";

export const auth = new Elysia({ prefix: "/auth" })
  .use(cookie())
  .post(
    "/login",
    async ({ body, cookie, set }) => {
      const result = await login(body.username, body.password);
      if (!result) {
        set.status = 401;
        return { message: "Invalid username or password" };
      }

      const { token, user } = result;

      cookie[SESSION_COOKIE].set({
        value: token,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_TTL_SECONDS,
        secure: process.env.NODE_ENV === "production",
      });

      return {
        token,
        user: {
          user_uuid: user.uuid,
          username: user.username,
          name: user.name,
        },
      };
    },
    {
      body: LoginDto,
      response: LoginResponseDto,
      detail: { summary: "Login (Bearer for mobile/desktop, cookie for web)" },
    }
  )
  .post(
    "/logout",
    async ({ headers, cookie, set }) => {
      const token = extractToken(
        headers as Record<string, string | undefined>,
        cookie as unknown as { sid?: { value?: string } }
      );
      await logout(token);
      cookie[SESSION_COOKIE].remove();
      set.status = 200;
      return { message: "Logged out" };
    },
    {
      response: MessageDto,
      detail: { summary: "Logout (clears cookie + Valkey session)" },
    }
  )
  .use(
    authenticated().get(
      "/me",
      ({ user }) => {
        const u = user!;
        return {
          user_uuid: u.uuid,
          username: u.username,
          name: u.name,
        };
      },
      {
        response: UserPublicDto,
        detail: { summary: "Current user (Bearer or cookie)" },
      }
    )
  );
