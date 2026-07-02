import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('--- Database Check ---');
  const userCount = await db.user.count();
  const categoryCount = await db.category.count();
  const productCount = await db.product.count();
  const variantCount = await db.productVariant.count();
  const orderCount = await db.order.count();

  console.log(`Users: ${userCount}`);
  console.log(`Categories: ${categoryCount}`);
  console.log(`Products: ${productCount}`);
  console.log(`Product Variants: ${variantCount}`);
  console.log(`Orders: ${orderCount}`);

  console.log('\n--- Sample Products ---');
  const sampleProducts = await db.product.findMany({
    take: 5,
    select: { id: true, title: true, stock: true, variants: { select: { id: true, size: true, color: true, stock: true } } }
  });
  console.log(JSON.stringify(sampleProducts, null, 2));

  console.log('\n--- Sample Users ---');
  const sampleUsers = await db.user.findMany({
    take: 3,
    select: { id: true, name: true, email: true, role: true }
  });
  console.log(JSON.stringify(sampleUsers, null, 2));
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
