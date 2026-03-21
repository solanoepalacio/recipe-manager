import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

describe('ERGO-04: Slug/UUID dual lookup — Prisma integration', () => {
  let householdA: { id: string };
  let householdB: { id: string };
  let userA: { id: string };
  let recipeA: { id: string; slug: string };

  beforeAll(async () => {
    // Create two households
    householdA = await prisma.household.create({ data: { name: 'Test HH A' } });
    householdB = await prisma.household.create({ data: { name: 'Test HH B' } });

    // Create a user in household A
    userA = await prisma.user.create({
      data: {
        email: 'slug-test-a@test.com',
        passwordHash: await bcrypt.hash('test', 10),
        name: 'Slug Test A',
        householdId: householdA.id,
        gender: 'other',
        dateOfBirth: new Date('1990-01-01'),
      },
    });

    // Create a recipe in household A with a known slug
    recipeA = await prisma.recipe.create({
      data: {
        name: 'Tortilla de Patatas',
        slug: 'tortilla-de-patatas',
        householdId: householdA.id,
        createdById: userA.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.recipe.deleteMany({ where: { id: recipeA.id } });
    await prisma.user.deleteMany({ where: { id: userA.id } });
    await prisma.household.deleteMany({ where: { id: { in: [householdA.id, householdB.id] } } });
    await prisma.$disconnect();
  });

  it('findFirst with householdId + slug returns the recipe', async () => {
    const recipe = await prisma.recipe.findFirst({
      where: { householdId: householdA.id, slug: 'tortilla-de-patatas' },
    });
    expect(recipe).not.toBeNull();
    expect(recipe!.id).toBe(recipeA.id);
  });

  it('findFirst with wrong householdId + slug returns null', async () => {
    const recipe = await prisma.recipe.findFirst({
      where: { householdId: householdB.id, slug: 'tortilla-de-patatas' },
    });
    expect(recipe).toBeNull();
  });

  it('findUnique with UUID returns the recipe', async () => {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeA.id },
    });
    expect(recipe).not.toBeNull();
    expect(recipe!.slug).toBe('tortilla-de-patatas');
  });

  it('findUnique with non-existent UUID returns null', async () => {
    const recipe = await prisma.recipe.findUnique({
      where: { id: '00000000-0000-4000-a000-000000000000' },
    });
    expect(recipe).toBeNull();
  });
});
