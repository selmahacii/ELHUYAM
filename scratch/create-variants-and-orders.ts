import { PrismaClient, OrderStatus, PaymentStatus, Role } from '@prisma/client';

const db = new PrismaClient();

const BLACK_ABAYA_VARIANT_IMAGE = "https://images.unsplash.com/photo-1621644062136-1f6cc1804c8f?auto=format&fit=crop&q=80&w=800";
const RED_ABAYA_VARIANT_IMAGE = "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800";

async function main() {
  console.log('🏁 Starting variant creation and mock orders...');

  // 1. Fetch some products
  const products = await db.product.findMany({
    take: 2,
    orderBy: { createdAt: 'desc' }
  });

  if (products.length < 2) {
    console.error('Not enough products in DB.');
    return;
  }

  const [p1, p2] = products;

  console.log(`Using products:\n- ${p1.title} (${p1.id})\n- ${p2.title} (${p2.id})`);

  // 2. Clear old variants if any
  await db.productVariant.deleteMany({
    where: { productId: { in: [p1.id, p2.id] } }
  });

  // 3. Create variants with custom images
  console.log('\n--- Creating Product Variants ---');
  const v1 = await db.productVariant.create({
    data: {
      productId: p1.id,
      size: "M",
      color: "Noir",
      colorHex: "#000000",
      image: BLACK_ABAYA_VARIANT_IMAGE,
      stock: 15,
      price: p1.price
    }
  });

  const v2 = await db.productVariant.create({
    data: {
      productId: p1.id,
      size: "L",
      color: "Bordeaux",
      colorHex: "#800020",
      image: RED_ABAYA_VARIANT_IMAGE,
      stock: 12,
      price: p1.price + 500 // slight price increase for Bordeaux
    }
  });

  console.log(`Created 2 variants for "${p1.title}":`);
  console.log(`- M (Noir) with image: ${v1.image}`);
  console.log(`- L (Bordeaux) with image: ${v2.image}`);

  // 4. Fetch/create a customer
  let customer = await db.user.findFirst({
    where: { role: Role.CUSTOMER }
  });

  if (!customer) {
    customer = await db.user.create({
      data: {
        name: 'Aisha Al-Hassan',
        email: 'aisha.hassan@example.com',
        role: Role.CUSTOMER,
        phone: '0655001122'
      }
    });
  }

  // 5. Create a new Order with the Bordeaux variant
  console.log('\n--- Creating Mock Order with Bordeaux Variant ---');
  const orderNumber = `ORD-VAR-${Math.floor(100000 + Math.random() * 900000)}`;
  const subtotal = v2.price!;
  const shippingFee = 800;
  const totalAmount = subtotal + shippingFee;

  const order = await db.order.create({
    data: {
      orderNumber,
      userId: customer.id,
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PENDING,
      subtotal,
      shippingFee,
      totalAmount,
      shippingFirstName: customer.name?.split(' ')[0] || 'Aisha',
      shippingLastName: customer.name?.split(' ')[1] || 'Al-Hassan',
      shippingStreet: 'Rue de la Grande Mosquée',
      shippingCity: 'Alger',
      shippingState: 'Alger',
      shippingPostalCode: '16000',
      shippingCountry: 'Algérie',
      shippingPhone: customer.phone || '0655001122',
      items: {
        create: [
          {
            productId: p1.id,
            quantity: 1,
            price: v2.price!,
            size: v2.size,
            color: v2.color,
            productTitle: `${p1.title} - L (Bordeaux)`,
            productImage: v2.image // This stores the Bordeaux variant image!
          }
        ]
      },
      statusHistory: {
        create: [
          { status: OrderStatus.PENDING, note: 'Commande passée par la cliente.' },
          { status: OrderStatus.CONFIRMED, note: 'Commande confirmée avec la variante Bordeaux.' }
        ]
      }
    }
  });

  // Decrement variant stock
  await db.productVariant.update({
    where: { id: v2.id },
    data: { stock: { decrement: 1 } }
  });

  console.log(`✅ Success! Created order ${orderNumber} for variant "${v2.color}" of product "${p1.title}".`);
  console.log(`The order detail page in admin will load: http://localhost:3001/admin/orders/${order.id}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
