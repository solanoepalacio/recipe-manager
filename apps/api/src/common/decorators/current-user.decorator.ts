import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export function currentUserFactory(_data: unknown, ctx: ExecutionContext) {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
}

export const CurrentUser = createParamDecorator(currentUserFactory);
