import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { RecipesService } from '../src/recipes/recipes.service';
import { PrismaService } from '../src/prisma/prisma.service';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

describe('ERGO-03: Compound recipe create — Prisma integration', () => {
  let service: RecipesService;
  let householdId: string;
  let userId: string;
  let foodId: string;
  let unitId: string;

  beforeAll(async () => {
    // Seed test fixtures
    const household = await prisma.household.create({ data: { name: 'Compound Create Test HH' } });
    householdId = household.id;
    const user = await prisma.user.create({
      data: {
        email: 'compound-create-test@test.com',
        passwordHash: await bcrypt.hash('test', 10),
        name: 'Compound Test User',
        householdId,
        gender: 'other',
        dateOfBirth: new Date('1990-01-01'),
      },
    });
    userId = user.id;
    const food = await prisma.food.create({ data: { name: 'Tomate Compound Test' } });
    foodId = food.id;
    const unit = await prisma.unit.create({ data: { name: 'gramo compound', abbreviation: 'g' } });
    unitId = unit.id;

    // Instantiate service with real Prisma
    service = new RecipesService(prisma as unknown as PrismaService);
  });

  afterAll(async () => {
    // Clean up test data in reverse dependency order
    await prisma.instructionStep.deleteMany({ where: { recipe: { householdId } } });
    await prisma.recipeIngredient.deleteMany({ where: { section: { recipe: { householdId } } } });
    await prisma.ingredientSection.deleteMany({ where: { recipe: { householdId } } });
    await prisma.recipe.deleteMany({ where: { householdId } });
    await prisma.user.deleteMany({ where: { householdId } });
    await prisma.household.delete({ where: { id: householdId } });
    await prisma.food.delete({ where: { id: foodId } });
    await prisma.unit.delete({ where: { id: unitId } });
    await prisma.$disconnect();
  });

  it('backward-compat: no arrays creates recipe with default empty section', async () => {
    const result = await service.create(userId, householdId, { name: 'Simple Recipe Test' });

    expect(result.name).toBe('Simple Recipe Test');
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].title).toBeNull();
    expect(result.sections[0].ingredients).toHaveLength(0);
    expect(result.steps).toHaveLength(0);
  });

  it('success: compound create with ingredients and steps returns hydrated RecipeDetailResponse', async () => {
    const result = await service.create(userId, householdId, {
      name: 'Compound Full Recipe',
      ingredients: [
        { foodId, unitId, quantity: 200, note: 'picado' },
        { foodId, quantity: 50 },
      ],
      steps: [
        { body: 'Lavar los tomates' },
        { title: 'Preparacion', body: 'Cortar en cubos' },
      ],
    });

    expect(result.name).toBe('Compound Full Recipe');
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].title).toBeNull();
    expect(result.sections[0].ingredients).toHaveLength(2);
    expect(result.sections[0].ingredients[0].foodName).toBe('Tomate Compound Test');
    expect(result.sections[0].ingredients[0].unitName).toBe('gramo compound');
    expect(result.sections[0].ingredients[0].quantity).toBe(200);
    expect(result.sections[0].ingredients[0].note).toBe('picado');
    expect(result.sections[0].ingredients[0].order).toBe(0);
    expect(result.sections[0].ingredients[1].order).toBe(1);
    expect(result.sections[0].ingredients[1].unitName).toBeNull();
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].body).toBe('Lavar los tomates');
    expect(result.steps[0].title).toBeNull();
    expect(result.steps[0].order).toBe(0);
    expect(result.steps[1].title).toBe('Preparacion');
    expect(result.steps[1].body).toBe('Cortar en cubos');
    expect(result.steps[1].order).toBe(1);
  });

  it('FK rollback: invalid foodId leaves no orphaned recipe row', async () => {
    const countBefore = await prisma.recipe.count({ where: { householdId } });

    await expect(
      service.create(userId, householdId, {
        name: 'Should Not Exist',
        ingredients: [{ foodId: '00000000-0000-4000-a000-000000000000' }],
      }),
    ).rejects.toThrow('Invalid ingredient data: food or unit not found');

    const countAfter = await prisma.recipe.count({ where: { householdId } });
    expect(countAfter).toBe(countBefore);

    // Also verify no recipe with this name exists
    const orphan = await prisma.recipe.findFirst({
      where: { householdId, name: 'Should Not Exist' },
    });
    expect(orphan).toBeNull();
  });
});
