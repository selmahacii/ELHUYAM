const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Searching for category 'Abaya'...");
  const category = await prisma.category.findFirst({
    where: {
      name: {
        equals: 'Abaya',
        mode: 'insensitive'
      }
    }
  });

  if (!category) {
    console.log("Category 'Abaya' not found or already deleted.");
    return;
  }

  console.log(`Found category: ${category.name} (ID: ${category.id})`);

  // 1. Find all subcategories
  const subCategories = await prisma.category.findMany({
    where: { parentId: category.id }
  });

  console.log(`Found ${subCategories.length} subcategory(ies) of 'Abaya'.`);

  // Gather all category IDs to delete products from (the parent category + its subcategories)
  const categoryIds = [category.id, ...subCategories.map(c => c.id)];

  // Find all products in these categories
  const products = await prisma.product.findMany({
    where: { categoryId: { in: categoryIds } }
  });

  console.log(`Found ${products.length} product(s) in category 'Abaya' and its subcategories.`);

  for (const product of products) {
    console.log(`Checking order references for product: ${product.title} (ID: ${product.id})`);
    
    // Delete any order items if they exist to prevent foreign key errors
    const orderItemsCount = await prisma.orderItem.count({
      where: { productId: product.id }
    });

    if (orderItemsCount > 0) {
      console.log(`Deleting ${orderItemsCount} order items referencing this product...`);
      await prisma.orderItem.deleteMany({
        where: { productId: product.id }
      });
    }

    console.log(`Deleting product: ${product.title}`);
    await prisma.product.delete({
      where: { id: product.id }
    });
  }

  // Delete subcategories if any
  if (subCategories.length > 0) {
    console.log(`Deleting ${subCategories.length} subcategory(ies)...`);
    await prisma.category.deleteMany({
      where: { parentId: category.id }
    });
  }

  console.log(`Deleting category: ${category.name}`);
  await prisma.category.delete({
    where: { id: category.id }
  });

  console.log("Successfully deleted Abaya category and its associated products!");
}

run()
  .catch(e => {
    console.error("Error during deletion execution:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
