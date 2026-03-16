// apps/api/src/admin/users/dto/password-reset-url.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetUrlResponse {
  @ApiProperty({ description: 'One-time password reset URL containing raw token' })
  resetUrl: string;
}
