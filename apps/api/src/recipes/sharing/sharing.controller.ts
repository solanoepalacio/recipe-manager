import { Controller, Post, Delete, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SharingService } from './sharing.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('recipes')
@Controller('recipes')
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  @Post(':id/share')
  @ApiOperation({ summary: 'Generate a public share token for a recipe' })
  @ApiResponse({ status: 201, description: 'Share token generated' })
  @ApiResponse({ status: 403, description: 'Access denied — recipe not in your household' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  generateToken(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sharingService.generateToken(id, user.householdId);
  }

  @Delete(':id/share')
  @ApiOperation({ summary: 'Revoke the public share token for a recipe' })
  @ApiResponse({ status: 200, description: 'Share token revoked' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  revokeToken(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sharingService.revokeToken(id, user.householdId);
  }
}

@ApiTags('shared')
@Controller('shared')
export class SharedController {
  constructor(private readonly sharingService: SharingService) {}

  @Get(':token')
  @Public()
  @ApiOperation({ summary: 'View a publicly shared recipe — no authentication required' })
  @ApiResponse({ status: 200, description: 'Full recipe detail' })
  @ApiResponse({ status: 404, description: 'Token not found or revoked' })
  findByToken(@Param('token') token: string) {
    return this.sharingService.findByToken(token);
  }
}
