import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const units = [
  { name: 'cup', abbreviation: 'cup' },
  { name: 'tablespoon', abbreviation: 'tbsp' },
  { name: 'teaspoon', abbreviation: 'tsp' },
  { name: 'gram', abbreviation: 'g' },
  { name: 'kilogram', abbreviation: 'kg' },
  { name: 'milliliter', abbreviation: 'ml' },
  { name: 'liter', abbreviation: 'l' },
  { name: 'ounce', abbreviation: 'oz' },
  { name: 'pound', abbreviation: 'lb' },
  { name: 'piece', abbreviation: null },
  { name: 'slice', abbreviation: null },
  { name: 'clove', abbreviation: null },
  { name: 'pinch', abbreviation: null },
];

const foods = [
  { name: 'egg' },
  { name: 'milk' },
  { name: 'butter' },
  { name: 'flour' },
  { name: 'sugar' },
  { name: 'salt' },
  { name: 'black pepper' },
  { name: 'olive oil' },
  { name: 'vegetable oil' },
  { name: 'garlic' },
  { name: 'onion' },
  { name: 'tomato' },
  { name: 'potato' },
  { name: 'carrot' },
  { name: 'celery' },
  { name: 'spinach' },
  { name: 'lettuce' },
  { name: 'chicken breast' },
  { name: 'chicken thigh' },
  { name: 'ground beef' },
  { name: 'bacon' },
  { name: 'salmon' },
  { name: 'tuna' },
  { name: 'shrimp' },
  { name: 'rice' },
  { name: 'pasta' },
  { name: 'bread' },
  { name: 'cheese' },
  { name: 'cream cheese' },
  { name: 'heavy cream' },
  { name: 'sour cream' },
  { name: 'yogurt' },
  { name: 'lemon' },
  { name: 'lime' },
  { name: 'orange' },
  { name: 'apple' },
  { name: 'banana' },
  { name: 'strawberry' },
  { name: 'baking powder' },
  { name: 'baking soda' },
  { name: 'vanilla extract' },
  { name: 'honey' },
  { name: 'soy sauce' },
  { name: 'vinegar' },
  { name: 'paprika' },
  { name: 'cumin' },
  { name: 'oregano' },
  { name: 'basil' },
  { name: 'thyme' },
  { name: 'rosemary' },
];

async function main() {
  console.log('Seeding units...');
  for (const unit of units) {
    await prisma.unit.upsert({
      where: { name: unit.name },
      update: {},
      create: unit,
    });
  }
  console.log(`Seeded ${units.length} units.`);

  console.log('Seeding foods...');
  for (const food of foods) {
    await prisma.food.upsert({
      where: { name: food.name },
      update: {},
      create: food,
    });
  }
  console.log(`Seeded ${foods.length} foods.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
