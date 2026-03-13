import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { ImagesService } from './images.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UploadImageResponse } from '@recipe-manager/shared';

@ApiTags('recipe-images')
@Controller('recipes/:recipeId/images')
export class ImagesController {
  constructor(private imagesService: ImagesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, _file, cb) => {
          // req.params values can be string | string[]; recipeId is always a single string
          const recipeId = req.params.recipeId as string;
          const dir = join(process.cwd(), 'uploads', 'recipes', recipeId);
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require('fs').mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        const allowed = /\.(jpg|jpeg|png|webp)$/i;
        if (!allowed.test(file.originalname)) {
          cb(new BadRequestException('Only jpg, jpeg, png, and webp files are allowed'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: 201, description: 'Image uploaded' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  uploadImage(
    @CurrentUser() user: { id: string; householdId: string },
    @Param('recipeId') recipeId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadImageResponse> {
    return this.imagesService.uploadImage(user.householdId, recipeId, file);
  }

  @Delete(':imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'Image deleted' })
  @ApiResponse({ status: 404, description: 'Recipe or image not found' })
  deleteImage(
    @CurrentUser() user: { id: string; householdId: string },
    @Param('recipeId') recipeId: string,
    @Param('imageId') imageId: string,
  ): Promise<void> {
    return this.imagesService.deleteImage(user.householdId, recipeId, imageId);
  }
}
