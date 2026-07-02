import { PrismaClient, OrderStatus, PaymentStatus, Role } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('🏁 Starting mock order creation and product stock updates...');

  // 1. Get all products
  const allProducts = await db.product.findMany();
  if (allProducts.length === 0) {
    console.error('No products found in the database. Please seed first.');
    return;
  }

  console.log(`Found ${allProducts.length} total products.`);

  // 2. Set some products to out of stock
  // Let's choose 4 products and set their stock to 0
  const outOfStockProducts = allProducts.slice(0, 4);
  console.log('\n--- Setting products to out of stock ---');
  for (const product of outOfStockProducts) {
    await db.product.update({
      where: { id: product.id },
      data: { stock: 0 }
    });
    console.log(`❌ Product "${product.title}" (${product.sku}) set to OUT OF STOCK.`);
  }

  // 3. Find customer users to assign orders to
  let customers = await db.user.findMany({
    where: { role: Role.CUSTOMER }
  });

  // If no customers, use admin or create dummy customers
  if (customers.length === 0) {
    console.log('No CUSTOMER role users found. Creating a dummy customer...');
    const dummy = await db.user.create({
      data: {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        role: Role.CUSTOMER,
        phone: '0550123456'
      }
    });
    customers = [dummy];
  }

  // 4. Filter in-stock products for ordering
  const inStockProducts = allProducts.slice(4).filter(p => p.stock > 0);
  if (inStockProducts.length === 0) {
    console.error('No in-stock products available to create orders.');
    return;
  }

  // 5. Define target statuses for the new orders
  const testStatuses = [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED
  ];

  console.log('\n--- Creating Mock Orders ---');

  for (let idx = 0; idx < testStatuses.length; idx++) {
    const status = testStatuses[idx];
    const client = customers[idx % customers.length];
    
    // Choose 1 to 2 random in-stock products
    const itemsCount = Math.floor(Math.random() * 2) + 1;
    const selectedProducts = [];
    let subtotal = 0;
    
    // Pick unique products
    for (let k = 0; k < itemsCount; k++) {
      const p = inStockProducts[(idx + k) % inStockProducts.length];
      const qty = Math.floor(Math.random() * 2) + 1;
      
      // Update stock: decrement it
      const newStock = Math.max(0, p.stock - qty);
      await db.product.update({
        where: { id: p.id },
        data: { stock: newStock }
      });
      p.stock = newStock; // Keep local copy updated
      
      subtotal += p.price * qty;
      selectedProducts.push({
        productId: p.id,
        quantity: qty,
        price: p.price,
        productTitle: p.title,
        productImage: (p.images as any)[0] || null
      });
    }

    const shippingFee = 800;
    const totalAmount = subtotal + shippingFee;
    const orderNumber = `ORD-MOCK-${Math.floor(100000 + Math.random() * 900000)}`;

    const order = await db.order.create({
      data: {
        orderNumber,
        userId: client.id,
        status: status,
        paymentStatus: status === OrderStatus.DELIVERED ? PaymentStatus.PAID : PaymentStatus.PENDING,
        subtotal,
        shippingFee,
        totalAmount,
        shippingFirstName: client.name?.split(' ')[0] || 'Client',
        shippingLastName: client.name?.split(' ')[1] || 'Test',
        shippingStreet: `${Math.floor(Math.random() * 150) + 1} Boulevard de la République`,
        shippingCity: 'Alger',
        shippingState: 'Alger',
        shippingPostalCode: '16000',
        shippingCountry: 'Algérie',
        shippingPhone: client.phone || '0555123456',
        trackingNumber: [OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED].includes(status as any) ? `TRK-MCK-${Math.floor(1000000 + Math.random() * 9000000)}` : null,
        carrier: 'ZR Express',
        items: {
          create: selectedProducts
        }
      }
    });

    // Create Order Status History Progression
    // PENDING is always first
    await db.orderStatusHistory.create({
      data: { orderId: order.id, status: OrderStatus.PENDING, note: 'Commande créée avec succès via script de test.' }
    });

    if (status !== OrderStatus.PENDING && status !== OrderStatus.CANCELLED) {
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: OrderStatus.CONFIRMED, note: 'Commande validée par le service client.' }
      });
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: OrderStatus.PROCESSING, note: 'En cours de préparation dans nos entrepôts.' }
      });
    }

    if ([OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED].includes(status as any)) {
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: OrderStatus.SHIPPED, note: 'Colis expédié avec ZR Express.' }
      });
    }

    if (status === OrderStatus.OUT_FOR_DELIVERY || status === OrderStatus.DELIVERED) {
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: OrderStatus.OUT_FOR_DELIVERY, note: 'Colis en cours de livraison.' }
      });
    }

    if (status === OrderStatus.DELIVERED) {
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: OrderStatus.DELIVERED, note: 'Commande livrée et payée.' }
      });
    }

    if (status === OrderStatus.CANCELLED) {
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: OrderStatus.CANCELLED, note: 'Commande annulée.' }
      });
    }

    console.log(`📦 Order created: ${orderNumber} | Status: ${status} | Total: ${totalAmount} DZD | Customer: ${client.name || client.email}`);
  }

  console.log('\n✅ Script completed successfully!');
}

main()
  .catch((err) => {
    console.error('❌ Error executing script:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
