import { Injectable, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import type { UploadImageResponse } from '@recipe-manager/shared';

@Injectable()
export class ImagesService {
  constructor(private prisma: PrismaService) {}

  async uploadImage(
    householdId: string,
    recipeId: string,
    file: Express.Multer.File,
  ): Promise<UploadImageResponse> {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, householdId },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

    const agg = await this.prisma.recipeImage.aggregate({
      where: { recipeId },
      _max: { order: true },
    });
    const order = (agg._max.order ?? 0) + 1;

    const url = `/uploads/recipes/${recipeId}/${file.filename}`;

    const image = await this.prisma.recipeImage.create({
      data: { recipeId, url, order },
    });

    return { id: image.id, url: image.url, order: image.order };
  }

  async deleteImage(
    householdId: string,
    recipeId: string,
    imageId: string,
  ): Promise<void> {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, householdId },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

    const image = await this.prisma.recipeImage.findFirst({
      where: { id: imageId, recipeId },
    });
    if (!image) throw new NotFoundException('Image not found');

    await this.prisma.recipeImage.delete({ where: { id: imageId } });

    // Delete file from disk — ignore if file not found
    try {
      const filePath = join(process.cwd(), image.url);
      await fs.unlink(filePath);
    } catch (err: unknown) {
      // ENOENT = file already gone, that's fine for a delete operation
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }
  }
}
