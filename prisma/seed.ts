import { PrismaClient, Role, OrderStatus, PaymentStatus, ReviewStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const db = new PrismaClient();

// Pinterest-aesthetic placeholder images for modest fashion
const HIJAB_IMAGES = [
  "https://images.unsplash.com/photo-1584184924103-e310d9dc82fc?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1574291814206-363acdf2aa79?auto=format&fit=crop&q=80&w=800",
];
const ABAYA_IMAGES = [
  "https://images.unsplash.com/photo-1621644062136-1f6cc1804c8f?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&q=80&w=800"
];
const GENERIC_IMAGES = [
  "https://images.unsplash.com/photo-1598522325852-c32ce022b724?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=800"
];

const CATEGORIES = [
  { name: 'Abaya', slug: 'abaya', description: 'Robes longues et élégantes' },
  { name: 'Hijab', slug: 'hijab', description: 'Voiles de haute qualité' },
  { name: 'Khimar', slug: 'khimar', description: 'Voiles longs et fluides' },
  { name: 'Niqab', slug: 'niqab', description: 'Voiles intégraux' },
  { name: 'Gloves', slug: 'gloves', description: 'Gants élégants et discrets' }
];

const REVIEW_COMMENTS = [
  "Qualité incroyable, je recommande !",
  "Magnifique, le tissu est très doux.",
  "La couleur correspond parfaitement aux photos.",
  "Livraison super rapide, très satisfaite de mon achat.",
  "Je suis amoureuse de cette coupe. Parfaite !",
  "Tissu très opaque et fluide, mashallah.",
  "Très belle pièce, je l'ai portée pour l'Aïd, tout le monde a adoré.",
  "Un peu long pour moi mais la qualité est au rendez-vous.",
  "Excellent rapport qualité/prix.",
  "Superbe finition, je recommanderai sur votre site inshallah.",
  "Le retombé est juste sublime, je valide à 100%."
];

const REVIEW_NAMES = ["Sarah", "Fatima", "Aisha", "Mariam", "Khadija", "Nour", "Yasmine", "Imane", "Hafsa", "Zaynab"];

async function main() {
  console.log('🧹 Nettoyage de la base de données (Clean Slate)...');
  await db.orderStatusHistory.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.publicReview.deleteMany();
  await db.review.deleteMany();
  await db.cartItem.deleteMany();
  await db.wishlistItem.deleteMany();
  await db.productVariant.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.user.deleteMany();

  console.log('🌱 Début du seeding massif...');

  // 1. Création des Utilisateurs
  console.log('👤 Création des utilisateurs...');
  const defaultPassword = await hash('Password123!', 12);

  const admin = await db.user.create({
    data: { name: 'Admin El Huyaam', email: 'admin@elhuyaam.com', password: defaultPassword, role: Role.ADMIN },
  });

  const confirmatrice1 = await db.user.create({
    data: { name: 'Hajar (Confirmatrice)', email: 'confirmatrice1@elhuyaam.com', password: defaultPassword, role: Role.CONFIRMATRICE, phone: '0611111111' },
  });
  
  const confirmatrice2 = await db.user.create({
    data: { name: 'Soumaya (Confirmatrice)', email: 'confirmatrice2@elhuyaam.com', password: defaultPassword, role: Role.CONFIRMATRICE, phone: '0622222222' },
  });

  const client1 = await db.user.create({
    data: { name: 'Fatima Zahra', email: 'client1@elhuyaam.com', password: defaultPassword, role: Role.CUSTOMER, phone: '0633333333' },
  });

  const client2 = await db.user.create({
    data: { name: 'Aisha Y.', email: 'client2@elhuyaam.com', password: defaultPassword, role: Role.CUSTOMER, phone: '0644444444' },
  });

  // 2. Création des Catégories
  console.log('📁 Création des catégories...');
  const categoryIds: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const created = await db.category.create({
      data: { name: cat.name, slug: cat.slug, description: cat.description, featured: true },
    });
    categoryIds[cat.name] = created.id;
  }

  // 3. Création Massive de Produits
  console.log('👗 Création de 45 produits de haute variété...');
  
  const productsToCreate = [
    // Abayas (10)
    { cat: 'Abaya', prefix: 'Abaya', suffixes: ['Dubaï Premium', 'Soie de Médine', 'Nidha Luxe', 'Papillon Noir', 'Kimono Satin', 'Plissée Émeraude', 'Broderie Or', 'Papillon Beige', 'Manches Bouffantes', 'Fluide Nude'] },
    // Hijabs (10)
    { cat: 'Hijab', prefix: 'Hijab', suffixes: ['Mousseline Douce', 'Jersey Premium', 'Soie de Médine Nude', 'Crêpe Blanc', 'Plissé Kaki', 'Satin de Soie Noir', 'Coton Léger', 'Froissé Taupe', 'Premium Rose Poudré', 'Gris Perle'] },
    // Khimars (10)
    { cat: 'Khimar', prefix: 'Khimar', suffixes: ['1 Voile Noir', '2 Voiles Pointus', '3 Voiles Arrondis', 'Soie de Médine Prune', 'Jazz Fluide', 'Nidha Kaki', 'Papillon Gris', 'Extra Long', 'Court Pratique', 'Beige Sable'] },
    // Niqabs (8)
    { cat: 'Niqab', prefix: 'Niqab', suffixes: ['Saoudien 3 Voiles', 'Casquette Noir', 'Égyptien Court', 'Sitar 2 Voiles Marron', 'Demi-Voile Beige', 'Extra Long Noir', '1 Voile Simple', 'Casquette Gris'] },
    // Gloves (7)
    { cat: 'Gloves', prefix: 'Gants', suffixes: ['Tactiles Simples', 'Coton Longs Noirs', 'Dentelle Soirée', 'Hiver Velours', 'Mitaines Discrètes', 'Satin Mariage', 'Opaques Quotidien'] }
  ];

  const createdProducts = [];

  for (const group of productsToCreate) {
    for (let i = 0; i < group.suffixes.length; i++) {
      const title = `${group.prefix} ${group.suffixes[i]}`;
      const slug = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-4)}-${i}`;
      const sku = `ELH-${group.cat.substring(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const price = Math.floor(Math.random() * (15000 - 1500 + 1) + 1500); // 1500 DZD to 15000 DZD
      const stock = Math.floor(Math.random() * 100);
      
      let images = GENERIC_IMAGES;
      if (group.cat === 'Hijab' || group.cat === 'Khimar' || group.cat === 'Niqab') images = HIJAB_IMAGES;
      if (group.cat === 'Abaya') images = ABAYA_IMAGES;
      
      // Shuffle images for variety
      const shuffledImages = [...images].sort(() => 0.5 - Math.random()).slice(0, 2);

      const p = await db.product.create({
        data: {
          title: title,
          slug: slug,
          description: `Magnifique ${title.toLowerCase()}, idéal pour toutes les occasions. Conçu avec des matériaux de haute qualité pour vous offrir confort, couvrance parfaite et élégance absolue. Une pièce maîtresse de notre collection Modest Fashion.`,
          price: price,
          stock: stock,
          sku: sku,
          images: shuffledImages,
          videos: [],
          tags: [],
          categoryId: categoryIds[group.cat],
          featured: Math.random() > 0.8, 
          bestseller: Math.random() > 0.8,
          newArrival: Math.random() > 0.7,
        }
      });
      createdProducts.push(p);
    }
  }

  // 4. Ajout des Avis Clients (100 Reviews)
  console.log('⭐ Génération de 100 avis clients...');
  let reviewCount = 0;
  for (let i = 0; i < 100; i++) {
    const p = createdProducts[Math.floor(Math.random() * createdProducts.length)];
    const rating = Math.floor(Math.random() * 3) + 3; // 3 to 5 stars
    const comment = REVIEW_COMMENTS[Math.floor(Math.random() * REVIEW_COMMENTS.length)];
    const name = REVIEW_NAMES[Math.floor(Math.random() * REVIEW_NAMES.length)];
    const isRegisteredClient = Math.random() > 0.5;

    await db.review.create({
      data: {
        productId: p.id,
        userId: isRegisteredClient ? (Math.random() > 0.5 ? client1.id : client2.id) : null,
        rating: rating,
        comment: comment,
        name: isRegisteredClient ? null : name,
        status: ReviewStatus.APPROVED,
        verified: isRegisteredClient
      }
    });
    
    // Update product aggregates
    await db.product.update({
      where: { id: p.id },
      data: {
        reviewCount: { increment: 1 },
        avgRating: rating // Simplification, not true average but good enough for visual dummy data
      }
    });
    reviewCount++;
  }

  // 5. Création de Commandes et Traçabilité
  console.log('📦 Création de 8 commandes avec traçabilité...');
  
  const statuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.CANCELLED];

  for (let i = 0; i < 8; i++) {
    const client = i % 2 === 0 ? client1 : client2;
    const currentStatus = statuses[i % statuses.length];
    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const p1 = createdProducts[Math.floor(Math.random() * createdProducts.length)];
    const p2 = createdProducts[Math.floor(Math.random() * createdProducts.length)];

    const subtotal = p1.price * 1 + p2.price * 2;
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
        shippingStreet: '123 Rue de la Liberté',
        shippingCity: 'Alger',
        shippingState: 'Alger',
        shippingPostalCode: '16000',
        shippingCountry: 'Algérie',
        shippingPhone: client.phone || '0555555555',
        trackingNumber: [OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED].includes(currentStatus as any) ? `TRK${Math.floor(1000000 + Math.random() * 9000000)}` : null,
        carrier: 'ZR Express',
        
        items: {
          create: [
            { productId: p1.id, quantity: 1, price: p1.price, productTitle: p1.title, productImage: (p1.images as any)[0] },
            { productId: p2.id, quantity: 2, price: p2.price, productTitle: p2.title, productImage: (p2.images as any)[0] }
          ]
        }
      }
    });

    // History (Traçabilité)
    await db.orderStatusHistory.create({
      data: { orderId: order.id, status: OrderStatus.PENDING, note: 'Commande placée avec succès.' }
    });

    if (currentStatus !== OrderStatus.PENDING && currentStatus !== OrderStatus.CANCELLED) {
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: OrderStatus.CONFIRMED, note: 'Commande confirmée par téléphone.' }
      });
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: OrderStatus.PROCESSING, note: 'La commande est en cours de préparation.' }
      });
    }

    if ([OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED].includes(currentStatus as any)) {
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: OrderStatus.SHIPPED, note: 'Le colis a été remis au transporteur.' }
      });
    }

    if (currentStatus === OrderStatus.DELIVERED) {
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: OrderStatus.OUT_FOR_DELIVERY, note: 'Le colis est en cours de livraison.' }
      });
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: OrderStatus.DELIVERED, note: 'Le colis a été livré au client.' }
      });
    }

    if (currentStatus === OrderStatus.CANCELLED) {
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: OrderStatus.CANCELLED, note: 'La commande a été annulée.' }
      });
    }
  }

  console.log(`✅ Seeding avancé terminé ! ${createdProducts.length} produits, 5 catégories, 5 utilisateurs, 8 commandes, et 100 avis clients créés avec succès.`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
