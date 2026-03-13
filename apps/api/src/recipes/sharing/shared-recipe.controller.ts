import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { SharingService } from './sharing.service';
import { Public } from '../../common/decorators/public.decorator';
import type { SharedRecipeResponse } from '@recipe-manager/shared';

@ApiTags('recipe-sharing')
@Controller('recipes/shared')
export class SharedRecipeController {
  constructor(private sharingService: SharingService) {}

  @Get(':token')
  @Public()
  @ApiResponse({ status: 200, description: 'Shared recipe detail' })
  @ApiResponse({ status: 404, description: 'Shared recipe not found' })
  getSharedRecipe(
    @Param('token') token: string,
  ): Promise<SharedRecipeResponse> {
    return this.sharingService.getSharedRecipe(token);
  }
}
