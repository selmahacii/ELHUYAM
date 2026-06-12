import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('🧹 Nettoyage de la base de données pour la production (Remise à zéro)...');
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

  console.log('🌱 Initialisation de l\'unique profil Administrateur...');

  // Hachage du mot de passe admin spécifique
  const adminPassword = await hash('zinebelhuyam2026', 12);

  // Création du compte administrateur zinebelhuyam
  const admin = await db.user.create({
    data: {
      name: 'zinebelhuyam',
      email: 'zinebelhuyam@elhuyam.com', // Adresse email pour se connecter
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  console.log(`👤 Administrateur créé avec succès !`);
  console.log(`   - Nom d'utilisateur : ${admin.name}`);
  console.log(`   - Email de connexion : ${admin.email}`);
  console.log(`   - Mot de passe : zinebelhuyam2026`);
  console.log('✅ Base de données de production initialisée de manière 100% vierge !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de l\'initialisation de production:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
