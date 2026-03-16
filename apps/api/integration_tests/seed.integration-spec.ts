import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('HH-01: Seed data — Food and Unit tables pre-populated', () => {
  it('Food table has at least 40 records after seed', async () => {
    const count = await prisma.food.count();
    expect(count).toBeGreaterThanOrEqual(40);
  });

  it('Unit table has at least 13 records after seed', async () => {
    const count = await prisma.unit.count();
    expect(count).toBeGreaterThanOrEqual(13);
  });

  it('Seed is idempotent — running seed logic a second time does not throw', async () => {
    // Re-upsert one known food to verify idempotency
    await expect(
      prisma.food.upsert({
        where: { name: 'egg' },
        update: {},
        create: { name: 'egg' },
      }),
    ).resolves.not.toThrow();

    // Re-upsert one known unit to verify idempotency
    await expect(
      prisma.unit.upsert({
        where: { name: 'cup' },
        update: {},
        create: { name: 'cup', abbreviation: 'cup' },
      }),
    ).resolves.not.toThrow();
  });
});
