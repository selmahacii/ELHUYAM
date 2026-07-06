const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Searching for category 'Khimar'...");
  const category = await prisma.category.findFirst({
    where: {
      name: {
        equals: 'Khimar',
        mode: 'insensitive'
      }
    }
  });

  if (!category) {
    console.log("Category 'Khimar' not found or already deleted.");
    return;
  }

  console.log(`Found category: ${category.name} (ID: ${category.id})`);

  const products = await prisma.product.findMany({
    where: { categoryId: category.id }
  });

  console.log(`Found ${products.length} product(s) in category 'Khimar'.`);

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

  console.log(`Deleting category: ${category.name}`);
  await prisma.category.delete({
    where: { id: category.id }
  });

  console.log("Successfully deleted Khimar category and its associated products!");
}

run()
  .catch(e => {
    console.error("Error during deletion execution:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
