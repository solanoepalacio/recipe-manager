import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as fs from 'fs';
import { join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { ImageResponse } from '@recipe-manager/shared';

function toImageResponse(img: { id: string; url: string; order: number; createdAt: Date }): ImageResponse {
  return { id: img.id, url: img.url, order: img.order, createdAt: img.createdAt.toISOString() };
}

@Injectable()
export class ImagesService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyRecipeOwnership(recipeId: string, householdId: string) {
    const recipe = await this.prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) throw new NotFoundException(`Recipe ${recipeId} not found`);
    if (recipe.householdId !== householdId) throw new ForbiddenException('Access denied');
    return recipe;
  }

  async create(recipeId: string, householdId: string, file: Express.Multer.File): Promise<ImageResponse> {
    await this.verifyRecipeOwnership(recipeId, householdId);
    const maxOrder = await this.prisma.recipeImage.aggregate({
      where: { recipeId },
      _max: { order: true },
    });
    const image = await this.prisma.recipeImage.create({
      data: {
        recipeId,
        url: `/uploads/${file.filename}`,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });
    return toImageResponse(image);
  }

  async remove(recipeId: string, householdId: string, imageId: string): Promise<{ id: string }> {
    await this.verifyRecipeOwnership(recipeId, householdId);
    const image = await this.prisma.recipeImage.findUnique({ where: { id: imageId } });
    if (!image || image.recipeId !== recipeId) {
      throw new NotFoundException(`Image ${imageId} not found`);
    }
    await this.prisma.recipeImage.delete({ where: { id: imageId } });
    // Extract filename from stored relative URL (e.g. '/uploads/abc123.jpg' -> 'abc123.jpg')
    const filename = image.url.replace('/uploads/', '');
    await fs.promises
      .unlink(join(process.cwd(), 'uploads', filename))
      .catch(() => {}); // swallow ENOENT — file may already be gone
    return { id: imageId };
  }
}
