import {
  Controller, Post, Delete, Param, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { ImagesService } from './images.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

const multerOptions = {
  storage: diskStorage({
    destination: join(process.cwd(), 'uploads'),
    filename: (_req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      const ext = extname(file.originalname).toLowerCase();
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  },
};

@ApiTags('recipes')
@Controller('recipes/:id/images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @ApiOperation({ summary: 'Upload an image for a recipe' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiResponse({ status: 201, description: 'Image uploaded' })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  upload(
    @Param('id') recipeId: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.imagesService.create(recipeId, user.householdId, file);
  }

  @Delete(':imageId')
  @ApiOperation({ summary: 'Delete a recipe image' })
  @ApiResponse({ status: 200, description: 'Image deleted' })
  remove(
    @Param('id') recipeId: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: any,
  ) {
    return this.imagesService.remove(recipeId, user.householdId, imageId);
  }
}
