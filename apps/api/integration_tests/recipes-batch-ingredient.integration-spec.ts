import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

describe('ERGO-05: Batch ingredient add — Prisma integration', () => {
  let householdId: string;
  let userId: string;
  let recipeId: string;
  let sectionId: string;
  let foodTomateId: string;
  let foodCebollaId: string;
  let unitGramoId: string;

  beforeAll(async () => {
    const household = await prisma.household.create({ data: { name: 'Batch Test HH' } });
    householdId = household.id;

    const user = await prisma.user.create({
      data: {
        email: 'batch-ingredient-test@test.com',
        passwordHash: await bcrypt.hash('test', 10),
        name: 'Batch Test User',
        householdId,
        gender: 'other',
        dateOfBirth: new Date('1990-01-01'),
      },
    });
    userId = user.id;

    const recipe = await prisma.recipe.create({
      data: {
        name: 'Receta Batch Test',
        slug: 'receta-batch-test',
        householdId,
        createdById: userId,
      },
    });
    recipeId = recipe.id;

    const section = await prisma.ingredientSection.create({
      data: { recipeId, title: null, order: 0 },
    });
    sectionId = section.id;

    const foodTomate = await prisma.food.create({ data: { name: 'Tomate Batch Test' } });
    foodTomateId = foodTomate.id;

    const foodCebolla = await prisma.food.create({ data: { name: 'Cebolla Batch Test' } });
    foodCebollaId = foodCebolla.id;

    const unitGramo = await prisma.unit.create({
      data: { name: 'gramo batch test', abbreviation: 'g' },
    });
    unitGramoId = unitGramo.id;
  });

  afterAll(async () => {
    await prisma.recipeIngredient.deleteMany({ where: { sectionId } });
    await prisma.ingredientSection.deleteMany({ where: { id: sectionId } });
    await prisma.recipe.deleteMany({ where: { id: recipeId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.household.deleteMany({ where: { id: householdId } });
    await prisma.food.deleteMany({ where: { id: { in: [foodTomateId, foodCebollaId] } } });
    await prisma.unit.deleteMany({ where: { id: unitGramoId } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.recipeIngredient.deleteMany({ where: { sectionId } });
  });

  it('happy path: batch insert on empty section assigns order 0 and 1', async () => {
    await prisma.$transaction(async (tx) => {
      const maxOrder = await tx.recipeIngredient.aggregate({
        where: { sectionId },
        _max: { order: true },
      });
      const startOrder = (maxOrder._max.order ?? -1) + 1;

      await tx.recipeIngredient.createMany({
        data: [
          { sectionId, foodId: foodTomateId, unitId: unitGramoId, quantity: 200, note: null, order: startOrder + 0 },
          { sectionId, foodId: foodCebollaId, unitId: null, quantity: null, note: null, order: startOrder + 1 },
        ],
      });
    });

    const section = await prisma.ingredientSection.findUnique({
      where: { id: sectionId },
      include: {
        ingredients: {
          include: { food: true, unit: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    expect(section).not.toBeNull();
    expect(section!.ingredients).toHaveLength(2);
    expect(section!.ingredients[0].order).toBe(0);
    expect(section!.ingredients[1].order).toBe(1);
    expect(section!.ingredients[0].food.name).toBe('Tomate Batch Test');
    expect(section!.ingredients[1].food.name).toBe('Cebolla Batch Test');
    expect(section!.ingredients[0].unit?.name).toBe('gramo batch test');
    expect(section!.ingredients[1].unit).toBeNull();
  });

  it('order continuation: batch insert on non-empty section continues from MAX+1', async () => {
    // Pre-insert 1 ingredient at order 0
    await prisma.recipeIngredient.create({
      data: { sectionId, foodId: foodTomateId, unitId: null, quantity: null, note: null, order: 0 },
    });

    // Now batch-insert 2 more
    await prisma.$transaction(async (tx) => {
      const maxOrder = await tx.recipeIngredient.aggregate({
        where: { sectionId },
        _max: { order: true },
      });
      const startOrder = (maxOrder._max.order ?? -1) + 1;

      await tx.recipeIngredient.createMany({
        data: [
          { sectionId, foodId: foodCebollaId, unitId: null, quantity: null, note: null, order: startOrder + 0 },
          { sectionId, foodId: foodTomateId, unitId: null, quantity: null, note: null, order: startOrder + 1 },
        ],
      });
    });

    const ingredients = await prisma.recipeIngredient.findMany({
      where: { sectionId },
      orderBy: { order: 'asc' },
    });

    expect(ingredients).toHaveLength(3);
    expect(ingredients[0].order).toBe(0);
    expect(ingredients[1].order).toBe(1);
    expect(ingredients[2].order).toBe(2);
  });

  it('FK rollback: invalid foodId causes full rollback — no partial inserts', async () => {
    const invalidFoodId = '00000000-0000-4000-a000-000000000099';

    await expect(
      prisma.$transaction(async (tx) => {
        const maxOrder = await tx.recipeIngredient.aggregate({
          where: { sectionId },
          _max: { order: true },
        });
        const startOrder = (maxOrder._max.order ?? -1) + 1;

        await tx.recipeIngredient.createMany({
          data: [
            { sectionId, foodId: foodTomateId, unitId: null, quantity: null, note: null, order: startOrder + 0 },
            { sectionId, foodId: invalidFoodId, unitId: null, quantity: null, note: null, order: startOrder + 1 },
          ],
        });
      }),
    ).rejects.toThrow();

    const count = await prisma.recipeIngredient.count({ where: { sectionId } });
    expect(count).toBe(0);
  });

  it('hydration: returned ingredients include food.name and unit.name', async () => {
    await prisma.$transaction(async (tx) => {
      const maxOrder = await tx.recipeIngredient.aggregate({
        where: { sectionId },
        _max: { order: true },
      });
      const startOrder = (maxOrder._max.order ?? -1) + 1;

      await tx.recipeIngredient.createMany({
        data: [
          { sectionId, foodId: foodTomateId, unitId: unitGramoId, quantity: 100, note: null, order: startOrder + 0 },
          { sectionId, foodId: foodCebollaId, unitId: null, quantity: null, note: null, order: startOrder + 1 },
        ],
      });
    });

    const ingredients = await prisma.recipeIngredient.findMany({
      where: { sectionId },
      include: { food: true, unit: true },
      orderBy: { order: 'asc' },
    });

    expect(ingredients).toHaveLength(2);
    expect(ingredients[0].food.name).toBeTruthy();
    expect(ingredients[0].food.name).toBe('Tomate Batch Test');
    expect(ingredients[0].unit).not.toBeNull();
    expect(ingredients[0].unit!.name).toBe('gramo batch test');
    expect(ingredients[1].food.name).toBe('Cebolla Batch Test');
    expect(ingredients[1].unit).toBeNull();
  });
});
