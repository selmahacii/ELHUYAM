const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function run() {
  try {
    const slug = 'hijab-crêpe-blanc-4801-3';
    console.log(`Searching for product with slug: "${slug}"...`);
    const product = await db.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: true
      }
    });

    if (!product) {
      console.log("Product not found in database!");
      return;
    }

    console.log("\n--- PRODUCT DETAILS ---");
    console.log(`ID: ${product.id}`);
    console.log(`Title: ${product.title}`);
    console.log(`Slug: ${product.slug}`);
    console.log(`Archived: ${product.archived}`);
    console.log(`Price: ${product.price}`);
    console.log(`Discount Price: ${product.discountPrice}`);
    console.log(`Stock: ${product.stock}`);
    console.log(`Category: ${product.category?.name} (Slug: ${product.category?.slug})`);
    console.log(`Images:`, product.images);
    console.log(`Variants Count: ${product.variants.length}`);
    product.variants.forEach((v, index) => {
      console.log(`  [Variant ${index + 1}] ID: ${v.id}, Size: ${v.size}, Color: ${v.color}, Stock: ${v.stock}, Price: ${v.price}`);
    });

  } catch (err) {
    console.error("Error executing script:", err);
  } finally {
    await db.$disconnect();
  }
}

run();
