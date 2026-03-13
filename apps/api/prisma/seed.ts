import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed units
  const units = [
    { name: 'cup', abbreviation: 'cup' },
    { name: 'tablespoon', abbreviation: 'tbsp' },
    { name: 'teaspoon', abbreviation: 'tsp' },
    { name: 'gram', abbreviation: 'g' },
    { name: 'kilogram', abbreviation: 'kg' },
    { name: 'milliliter', abbreviation: 'ml' },
    { name: 'liter', abbreviation: 'L' },
    { name: 'ounce', abbreviation: 'oz' },
    { name: 'pound', abbreviation: 'lb' },
    { name: 'unit', abbreviation: null },
  ];

  for (const unit of units) {
    await prisma.unit.upsert({
      where: { name: unit.name },
      update: {},
      create: unit,
    });
  }
  console.log(`Seeded ${units.length} units`);

  // Seed common foods
  const foods = [
    'All-purpose flour', 'Baking powder', 'Baking soda', 'Salt', 'Sugar',
    'Brown sugar', 'Powdered sugar', 'Butter', 'Vegetable oil', 'Olive oil',
    'Eggs', 'Milk', 'Heavy cream', 'Sour cream', 'Yogurt',
    'Vanilla extract', 'Cocoa powder', 'Chocolate chips', 'Honey', 'Maple syrup',
    'Chicken breast', 'Ground beef', 'Pork chops', 'Bacon', 'Salmon',
    'Garlic', 'Onion', 'Tomato', 'Bell pepper', 'Carrot',
    'Celery', 'Potato', 'Sweet potato', 'Broccoli', 'Spinach',
    'Lettuce', 'Cucumber', 'Zucchini', 'Mushrooms', 'Corn',
    'Rice', 'Pasta', 'Bread crumbs', 'Oats', 'Quinoa',
    'Black beans', 'Chickpeas', 'Lentils', 'Canned tomatoes', 'Chicken broth',
    'Soy sauce', 'Hot sauce', 'Worcestershire sauce', 'Dijon mustard', 'Mayonnaise',
    'Ketchup', 'Apple cider vinegar', 'Lemon juice', 'Lime juice', 'Orange juice',
    'Cheddar cheese', 'Mozzarella cheese', 'Parmesan cheese', 'Cream cheese', 'Feta cheese',
    'Black pepper', 'Cumin', 'Paprika', 'Oregano', 'Thyme',
    'Rosemary', 'Basil', 'Parsley', 'Cilantro', 'Chili powder',
    'Cinnamon', 'Nutmeg', 'Ginger', 'Turmeric', 'Cayenne pepper',
  ];

  for (const name of foods) {
    await prisma.food.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Seeded ${foods.length} foods`);

  // Seed dev admin account
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Admin',
      email: adminEmail,
      passwordHash,
    },
  });
  console.log(`Seeded dev admin: ${adminEmail} / ${adminPassword}`);

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
