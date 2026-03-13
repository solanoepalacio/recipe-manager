import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export function currentAdminFactory(_data: unknown, ctx: ExecutionContext) {
  const request = ctx.switchToHttp().getRequest();
  return request.admin;
}

export const CurrentAdmin = createParamDecorator(currentAdminFactory);
