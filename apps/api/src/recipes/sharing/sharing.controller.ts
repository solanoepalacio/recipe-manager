import {
  Controller,
  Post,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { SharingService } from './sharing.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ShareRecipeResponse } from '@recipe-manager/shared';

@ApiTags('recipe-sharing')
@Controller('recipes/:recipeId/share')
export class SharingController {
  constructor(private sharingService: SharingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: 201, description: 'Share token generated' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  shareRecipe(
    @CurrentUser() user: { id: string; householdId: string },
    @Param('recipeId') recipeId: string,
  ): Promise<ShareRecipeResponse> {
    return this.sharingService.shareRecipe(user.householdId, recipeId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'Share token revoked' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  revokeShare(
    @CurrentUser() user: { id: string; householdId: string },
    @Param('recipeId') recipeId: string,
  ): Promise<void> {
    return this.sharingService.revokeShare(user.householdId, recipeId);
  }
}
