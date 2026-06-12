import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const IMAGE_MAP: Record<string, string[]> = {
  // --- KHIMARS ---
  "ELH-KHI-47640": [ // Khimar 2 Voiles Pointus
    "https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800"
  ],
  "ELH-KHI-32235": [ // Khimar 1 Voile Noir
    "https://images.unsplash.com/photo-1621644062136-1f6cc1804c8f?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1584184924103-e310d9dc82fc?auto=format&fit=crop&q=80&w=800"
  ],

  // --- HIJABS ---
  "ELH-HIJ-90750": [ // Hijab Gris Perle
    "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&q=80&w=800", // Elegant light grey/silver aesthetic
    "https://images.unsplash.com/photo-1598522325852-c32ce022b724?auto=format&fit=crop&q=80&w=800"
  ],
  "ELH-HIJ-52911": [ // Hijab Premium Rose Poudré
    "https://images.unsplash.com/photo-1621644062136-1f6cc1804c8f?auto=format&fit=crop&q=80&w=800", // Soft pink/nude tone
    "https://images.unsplash.com/photo-1584184924103-e310d9dc82fc?auto=format&fit=crop&q=80&w=800"
  ],
  "ELH-HIJ-43654": [ // Hijab Froissé Taupe
    "https://images.unsplash.com/photo-1574291814206-363acdf2aa79?auto=format&fit=crop&q=80&w=800", // Earthy taupe/brown
    "https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&q=80&w=800"
  ],
  "ELH-HIJ-56252": [ // Hijab Coton Léger
    "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=800", // Light cotton vibe
    "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&q=80&w=800"
  ],
  "ELH-HIJ-63061": [ // Hijab Satin de Soie Noir
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800", // Luxury black satin reflection
    "https://images.unsplash.com/photo-1584184924103-e310d9dc82fc?auto=format&fit=crop&q=80&w=800"
  ],
  "ELH-HIJ-40303": [ // Hijab Plissé Kaki
    "https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&q=80&w=800", // Dark green / earthy
    "https://images.unsplash.com/photo-1574291814206-363acdf2aa79?auto=format&fit=crop&q=80&w=800"
  ],
  "ELH-HIJ-49155": [ // Hijab Crêpe Blanc
    "https://images.unsplash.com/photo-1598522325852-c32ce022b724?auto=format&fit=crop&q=80&w=800", // Pure clean white
    "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&q=80&w=800"
  ],
  "ELH-HIJ-99067": [ // Hijab Soie de Médine Nude
    "https://images.unsplash.com/photo-1621644062136-1f6cc1804c8f?auto=format&fit=crop&q=80&w=800", // Beautiful nude/flesh
    "https://images.unsplash.com/photo-1574291814206-363acdf2aa79?auto=format&fit=crop&q=80&w=800"
  ],
  "ELH-HIJ-53047": [ // Hijab Jersey Premium
    "https://images.unsplash.com/photo-1584184924103-e310d9dc82fc?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=800"
  ],
  "ELH-HIJ-22446": [ // Hijab Mousseline Douce
    "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1598522325852-c32ce022b724?auto=format&fit=crop&q=80&w=800"
  ],

  // --- ABAYAS ---
  "ELH-ABA-35498": [ // Abaya Fluide Nude
    "https://images.unsplash.com/photo-1621644062136-1f6cc1804c8f?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1574291814206-363acdf2aa79?auto=format&fit=crop&q=80&w=800"
  ],
  "ELH-ABA-99364": [ // Abaya Manches Bouffantes
    "https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=800"
  ],
  "ELH-ABA-27342": [ // Abaya Papillon Beige
    "https://images.unsplash.com/photo-1574291814206-363acdf2aa79?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&q=80&w=800"
  ],
  "ELH-ABA-92212": [ // Abaya Broderie Or
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800", // Luxurious dark with gold aesthetic
    "https://images.unsplash.com/photo-1584184924103-e310d9dc82fc?auto=format&fit=crop&q=80&w=800"
  ],
  "ELH-ABA-99290": [ // Abaya Plissée Émeraude
    "https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&q=80&w=800", // Deep emerald vibes
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800"
  ],
  "ELH-ABA-95592": [ // Abaya Kimono Satin
    "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1598522325852-c32ce022b724?auto=format&fit=crop&q=80&w=800"
  ],
  "ELH-ABA-64130": [ // Abaya Papillon Noir
    "https://images.unsplash.com/photo-1584184924103-e310d9dc82fc?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800"
  ],
  "ELH-ABA-53899": [ // Abaya Nidha Luxe
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1621644062136-1f6cc1804c8f?auto=format&fit=crop&q=80&w=800"
  ],
};

async function main() {
  console.log('🔄 Mise à jour des images spécifiques...');

  for (const [sku, images] of Object.entries(IMAGE_MAP)) {
    const product = await db.product.findUnique({ where: { sku } });
    
    if (product) {
      await db.product.update({
        where: { sku },
        data: { images }
      });
      console.log(`✅ Mis à jour: ${sku} (${product.title})`);
    } else {
      console.log(`⚠️ Produit introuvable: ${sku}`);
    }
  }

  console.log('🎉 Terminé ! Les 20 produits ont désormais leurs images dédiées.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
