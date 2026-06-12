import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('📦 Génération de nouvelles commandes de test...');

  // 1. Récupérer des clients existants
  const clients = await db.user.findMany({
    where: { role: 'CUSTOMER' }
  });

  if (clients.length === 0) {
    console.error("Aucun client trouvé pour passer des commandes.");
    return;
  }

  // 2. Récupérer les produits existants
  const products = await db.product.findMany();
  
  if (products.length < 2) {
    console.error("Pas assez de produits dans la boutique.");
    return;
  }

  const statuses = [
    OrderStatus.PENDING, 
    OrderStatus.CONFIRMED, 
    OrderStatus.PROCESSING, 
    OrderStatus.SHIPPED, 
    OrderStatus.OUT_FOR_DELIVERY, 
    OrderStatus.DELIVERED, 
    OrderStatus.CANCELLED
  ];

  // 3. Créer 15 nouvelles commandes
  let createdCount = 0;
  for (let i = 0; i < 15; i++) {
    const client = clients[Math.floor(Math.random() * clients.length)];
    const currentStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Sélectionner 2 à 4 produits au hasard
    const numItems = Math.floor(Math.random() * 3) + 2;
    const orderItems = [];
    let subtotal = 0;

    for (let j = 0; j < numItems; j++) {
      const p = products[Math.floor(Math.random() * products.length)];
      const qty = Math.floor(Math.random() * 2) + 1;
      subtotal += p.price * qty;
      orderItems.push({
        productId: p.id,
        quantity: qty,
        price: p.price,
        productTitle: p.title,
        productImage: (p.images as any)[0] || null
      });
    }

    const shippingFee = 800;
    const totalAmount = subtotal + shippingFee;

    const order = await db.order.create({
      data: {
        orderNumber,
        userId: client.id,
        status: currentStatus,
        paymentStatus: currentStatus === OrderStatus.DELIVERED ? PaymentStatus.PAID : PaymentStatus.PENDING,
        subtotal,
        shippingFee,
        totalAmount,
        shippingFirstName: client.name?.split(' ')[0] || 'Client',
        shippingLastName: client.name?.split(' ')[1] || 'ElHuyaam',
        shippingStreet: `${Math.floor(Math.random() * 100)} Rue des Lilas`,
        shippingCity: 'Oran',
        shippingState: 'Oran',
        shippingPostalCode: '31000',
        shippingCountry: 'Algérie',
        shippingPhone: client.phone || '0555555555',
        trackingNumber: ([OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED] as OrderStatus[]).includes(currentStatus) ? `TRK${Math.floor(1000000 + Math.random() * 9000000)}` : null,
        carrier: 'ZR Express',
        
        items: {
          create: orderItems
        }
      }
    });

    // History (Traçabilité)
    await db.orderStatusHistory.create({
      data: { orderId: order.id, status: OrderStatus.PENDING, note: 'Commande placée avec succès depuis le site web.' }
    });

    if (currentStatus !== OrderStatus.PENDING && currentStatus !== OrderStatus.CANCELLED) {
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: OrderStatus.CONFIRMED, note: 'Commande confirmée par téléphone avec la confirmatrice.' }
      });
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: OrderStatus.PROCESSING, note: 'La commande est en cours d\'emballage dans l\'entrepôt.' }
      });
    }

    if (([OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED] as OrderStatus[]).includes(currentStatus)) {
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: OrderStatus.SHIPPED, note: 'Le colis a été remis au transporteur ZR Express.' }
      });
    }

    if (currentStatus === OrderStatus.DELIVERED || currentStatus === OrderStatus.OUT_FOR_DELIVERY) {
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: OrderStatus.OUT_FOR_DELIVERY, note: 'Le livreur est en route vers l\'adresse.' }
      });
    }

    if (currentStatus === OrderStatus.DELIVERED) {
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: OrderStatus.DELIVERED, note: 'Le colis a été livré au client avec succès.' }
      });
    }

    if (currentStatus === OrderStatus.CANCELLED) {
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: OrderStatus.CANCELLED, note: 'La commande a été annulée suite à la demande du client ou manque de stock.' }
      });
    }

    createdCount++;
  }

  console.log(`✅ Succès : ${createdCount} nouvelles commandes ont été ajoutées !`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
