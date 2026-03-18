/**
 * Dev/Staging seed — creates a test household, user, and sample recipes.
 *
 * Run with:  yarn workspace @recipe-manager/api seed:dev
 *
 * Safe to re-run: uses upsert everywhere. Does NOT run in production.
 * Production only runs seed.ts (units + foods).
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Credentials (change as needed for your local env)
// ---------------------------------------------------------------------------
const TEST_USER = {
  email: 'test@example.com',
  username: 'testuser',
  password: 'password123',
  name: 'Test User',
};

// ---------------------------------------------------------------------------
// Helper: look up a food/unit by name (must already exist from seed.ts)
// ---------------------------------------------------------------------------
async function food(name: string) {
  const f = await prisma.food.findUnique({ where: { name } });
  if (!f) throw new Error(`Food not found: "${name}" — run the base seed first`);
  return f.id;
}

async function unit(name: string) {
  const u = await prisma.unit.findUnique({ where: { name } });
  if (!u) throw new Error(`Unit not found: "${name}" — run the base seed first`);
  return u.id;
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ---------------------------------------------------------------------------
// Recipe definitions
// ---------------------------------------------------------------------------
type RecipeData = {
  name: string;
  description?: string;
  servingsQty?: number;
  servingsUnit?: string;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  sections: {
    title: string | null;
    ingredients: { food: string; unit?: string; quantity?: number; note?: string }[];
  }[];
  steps: { title?: string; body: string }[];
};

const RECIPES: RecipeData[] = [
  // 1 ── Scrambled Eggs
  {
    name: 'Huevos revueltos',
    description: 'Huevos revueltos suaves y cremosos, listos en 10 minutos.',
    servingsQty: 2,
    servingsUnit: 'porciones',
    prepTime: 5,
    cookTime: 5,
    totalTime: 10,
    sections: [
      {
        title: null,
        ingredients: [
          { food: 'egg', unit: 'piece', quantity: 4 },
          { food: 'milk', unit: 'tablespoon', quantity: 2 },
          { food: 'butter', unit: 'tablespoon', quantity: 1 },
          { food: 'salt', unit: 'pinch', quantity: 1 },
          { food: 'black pepper', unit: 'pinch', quantity: 1 },
        ],
      },
    ],
    steps: [
      { body: 'Batir los huevos con la leche, sal y pimienta en un tazón hasta obtener una mezcla homogénea.' },
      { body: 'Derretir la mantequilla en una sartén a fuego medio-bajo.' },
      { body: 'Verter la mezcla de huevos. Revolver suavemente con una espátula de goma, moviendo del borde hacia el centro.' },
      { body: 'Retirar del fuego cuando los huevos estén apenas cuajados pero aún cremosos. Servir de inmediato.' },
    ],
  },

  // 2 ── Garlic Pasta
  {
    name: 'Pasta al ajillo',
    description: 'Pasta con aceite de oliva, ajo y albahaca fresca. Un clásico italiano en 20 minutos.',
    servingsQty: 2,
    servingsUnit: 'porciones',
    prepTime: 5,
    cookTime: 15,
    totalTime: 20,
    sections: [
      {
        title: null,
        ingredients: [
          { food: 'pasta', unit: 'gram', quantity: 200 },
          { food: 'olive oil', unit: 'tablespoon', quantity: 4 },
          { food: 'garlic', unit: 'clove', quantity: 4 },
          { food: 'black pepper', unit: 'pinch', quantity: 1 },
          { food: 'salt', unit: 'pinch', quantity: 1 },
          { food: 'basil', note: 'unas hojas frescas para decorar' },
          { food: 'cheese', note: 'parmesano rallado al gusto' },
        ],
      },
    ],
    steps: [
      { body: 'Cocer la pasta en agua con sal abundante según las instrucciones del paquete hasta que esté al dente. Reservar 1 taza del agua de cocción.' },
      { body: 'Mientras tanto, calentar el aceite de oliva a fuego medio en una sartén grande. Añadir el ajo laminado y saltear 2 minutos sin que se dore.' },
      { body: 'Escurrir la pasta y agregarla a la sartén. Añadir un chorro del agua de cocción reservada y mezclar bien.' },
      { body: 'Salpimentar al gusto. Servir con albahaca fresca y queso parmesano.' },
    ],
  },

  // 3 ── Chicken Stir-Fry
  {
    name: 'Pollo salteado con verduras',
    description: 'Pollo tierno con zanahoria, cebolla y salsa de soja. Perfecto para una cena rápida entre semana.',
    servingsQty: 3,
    servingsUnit: 'porciones',
    prepTime: 15,
    cookTime: 15,
    totalTime: 30,
    sections: [
      {
        title: 'Marinada',
        ingredients: [
          { food: 'soy sauce', unit: 'tablespoon', quantity: 3 },
          { food: 'garlic', unit: 'clove', quantity: 2 },
          { food: 'black pepper', unit: 'pinch', quantity: 1 },
        ],
      },
      {
        title: 'Salteado',
        ingredients: [
          { food: 'chicken breast', unit: 'gram', quantity: 400 },
          { food: 'vegetable oil', unit: 'tablespoon', quantity: 2 },
          { food: 'onion', unit: 'piece', quantity: 1 },
          { food: 'carrot', unit: 'piece', quantity: 2 },
          { food: 'salt', unit: 'pinch', quantity: 1 },
        ],
      },
    ],
    steps: [
      { title: 'Marinar', body: 'Cortar el pollo en tiras. Mezclar con la marinada y dejar reposar 10 minutos.' },
      { title: 'Saltear', body: 'Calentar el aceite en un wok o sartén grande a fuego alto. Saltear el pollo marinado 5–6 minutos hasta que esté dorado y cocido. Retirar y reservar.' },
      { body: 'En la misma sartén, saltear la cebolla y la zanahoria cortadas en juliana durante 4–5 minutos.' },
      { body: 'Incorporar el pollo, mezclar todo y cocinar 1 minuto más. Rectificar de sal y servir con arroz blanco.' },
    ],
  },

  // 4 ── Banana Smoothie
  {
    name: 'Batido de plátano',
    description: 'Batido cremoso de plátano y yogur. Listo en 5 minutos, perfecto para el desayuno.',
    servingsQty: 1,
    servingsUnit: 'vaso',
    prepTime: 5,
    totalTime: 5,
    sections: [
      {
        title: null,
        ingredients: [
          { food: 'banana', unit: 'piece', quantity: 2 },
          { food: 'yogurt', unit: 'cup', quantity: 1 },
          { food: 'milk', unit: 'cup', quantity: 0.5 },
          { food: 'honey', unit: 'tablespoon', quantity: 1 },
        ],
      },
    ],
    steps: [
      { body: 'Pelar los plátanos y cortarlos en trozos. Si están maduros y congelados, el batido quedará más cremoso y frío.' },
      { body: 'Colocar todos los ingredientes en la licuadora. Triturar a velocidad alta durante 30–60 segundos hasta que esté suave.' },
      { body: 'Probar el dulzor y añadir más miel si se desea. Servir de inmediato.' },
    ],
  },

  // 5 ── Tomato Salad
  {
    name: 'Ensalada de tomate y albahaca',
    description: 'Ensalada sencilla de tomate fresco con aceite de oliva, vinagre y albahaca. Lista en minutos.',
    servingsQty: 2,
    servingsUnit: 'porciones',
    prepTime: 10,
    totalTime: 10,
    sections: [
      {
        title: null,
        ingredients: [
          { food: 'tomato', unit: 'piece', quantity: 4, note: 'maduros, de distintos colores si es posible' },
          { food: 'olive oil', unit: 'tablespoon', quantity: 3 },
          { food: 'vinegar', unit: 'tablespoon', quantity: 1 },
          { food: 'salt', unit: 'pinch', quantity: 1 },
          { food: 'black pepper', unit: 'pinch', quantity: 1 },
          { food: 'basil', note: 'un puñado de hojas frescas' },
        ],
      },
    ],
    steps: [
      { body: 'Lavar y cortar los tomates en rodajas o gajos según el tamaño.' },
      { body: 'Disponerlos en una fuente. Aliñar con aceite de oliva y vinagre.' },
      { body: 'Salpimentar y decorar con hojas de albahaca fresca. Servir a temperatura ambiente.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('\n🌱 Dev seed starting...\n');

  // 1. Household
  const household = await prisma.household.upsert({
    where: { id: 'dev-household-id' },
    update: { name: 'Test Household' },
    create: { id: 'dev-household-id', name: 'Test Household' },
  });
  console.log(`✓ Household: ${household.name} (${household.id})`);

  // 2. User
  const passwordHash = await bcrypt.hash(TEST_USER.password, 10);
  const user = await prisma.user.upsert({
    where: { email: TEST_USER.email },
    update: { passwordHash, username: TEST_USER.username, name: TEST_USER.name, householdId: household.id },
    create: {
      email: TEST_USER.email,
      username: TEST_USER.username,
      name: TEST_USER.name,
      passwordHash,
      householdId: household.id,
    },
  });
  console.log(`✓ User: ${user.email} / password: ${TEST_USER.password}`);

  // 3. Recipes
  console.log(`\nSeeding ${RECIPES.length} recipes...\n`);

  for (const data of RECIPES) {
    const slug = toSlug(data.name);

    // Upsert recipe (match by slug + household)
    const existing = await prisma.recipe.findFirst({ where: { householdId: household.id, slug } });

    const recipe = existing
      ? await prisma.recipe.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            description: data.description,
            servingsQty: data.servingsQty,
            servingsUnit: data.servingsUnit,
            prepTime: data.prepTime,
            cookTime: data.cookTime,
            totalTime: data.totalTime,
          },
        })
      : await prisma.recipe.create({
          data: {
            householdId: household.id,
            createdById: user.id,
            name: data.name,
            slug,
            description: data.description,
            servingsQty: data.servingsQty,
            servingsUnit: data.servingsUnit,
            prepTime: data.prepTime,
            cookTime: data.cookTime,
            totalTime: data.totalTime,
          },
        });

    // Re-create sections + ingredients (delete ingredients first due to FK constraint)
    const existingSections = await prisma.ingredientSection.findMany({ where: { recipeId: recipe.id }, select: { id: true } });
    await prisma.recipeIngredient.deleteMany({ where: { sectionId: { in: existingSections.map(s => s.id) } } });
    await prisma.ingredientSection.deleteMany({ where: { recipeId: recipe.id } });
    for (let si = 0; si < data.sections.length; si++) {
      const sec = data.sections[si];
      const section = await prisma.ingredientSection.create({
        data: { recipeId: recipe.id, title: sec.title, order: si },
      });
      for (let ii = 0; ii < sec.ingredients.length; ii++) {
        const ing = sec.ingredients[ii];
        await prisma.recipeIngredient.create({
          data: {
            sectionId: section.id,
            foodId: await food(ing.food),
            unitId: ing.unit ? await unit(ing.unit) : null,
            quantity: ing.quantity ?? null,
            note: ing.note ?? null,
            order: ii,
          },
        });
      }
    }

    // Re-create steps
    await prisma.instructionStep.deleteMany({ where: { recipeId: recipe.id } });
    for (let i = 0; i < data.steps.length; i++) {
      const step = data.steps[i];
      await prisma.instructionStep.create({
        data: { recipeId: recipe.id, title: step.title ?? null, body: step.body, order: i },
      });
    }

    console.log(`  ✓ ${data.name} (${data.sections.reduce((n, s) => n + s.ingredients.length, 0)} ingredients, ${data.steps.length} steps)`);
  }

  console.log('\n✅ Dev seed complete!\n');
  console.log(`   Login: ${TEST_USER.email}  /  ${TEST_USER.password}`);
  console.log('   API:   http://localhost:3001\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
