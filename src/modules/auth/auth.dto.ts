import { t } from "elysia";

export const LoginDto = t.Object({
  username: t.String({ minLength: 1 }),
  password: t.String({ minLength: 1 }),
});
export type LoginInput = typeof LoginDto.static;

export const UserPublicDto = t.Object({
  user_uuid: t.String(),
  username: t.String(),
  name: t.String(),
});

export const LoginResponseDto = t.Object({
  token: t.String(),
  user: UserPublicDto,
});

export const MessageDto = t.Object({
  message: t.String(),
});
