/**
 * GeoBite — Seed Script
 *
 * Populates the `places` table with ~18 realistic sample places in Bengaluru.
 * Safe to rerun: uses upsert keyed on (name + address) so duplicate calls
 * will update the row rather than insert it again.
 *
 * Run:  npx prisma db seed
 *   or: node prisma/seed.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const places = [
  // ── Restaurants ────────────────────────────────────────────────────────────
  {
    name: 'MTR (Mavalli Tiffin Room)',
    description:
      'Iconic 100-year-old South Indian restaurant famous for its fluffy idlis, crispy dosas, and Rava idlis. A Bengaluru institution that draws long queues every morning.',
    category: 'restaurant',
    latitude: 12.9493,
    longitude: 77.5812,
    address: '14, Lalbagh Road, Mavalli, Bengaluru, Karnataka 560004',
    averageRating: 4.5,
    priceLevel: 'budget',
    estimatedVisitMinutes: 45,
    isActive: true,
  },
  {
    name: 'Karavalli',
    description:
      'Award-winning coastal Karnataka and Kerala cuisine in an elegant heritage setting. Renowned for its fresh seafood, Coorgi pork, and traditional jackfruit dishes.',
    category: 'restaurant',
    latitude: 12.9718,
    longitude: 77.5988,
    address: 'The Gateway Hotel, 66, Residency Road, Bengaluru, Karnataka 560025',
    averageRating: 4.6,
    priceLevel: 'premium',
    estimatedVisitMinutes: 90,
    isActive: true,
  },
  {
    name: 'Truffles',
    description:
      `Cult-favourite American-style diner popular among Bengaluru's youth for giant burgers, loaded fries, and thick milkshakes. Always buzzing with energy.`,
    category: 'restaurant',
    latitude: 12.9352,
    longitude: 77.6245,
    address: '36, St Marks Road, Shanthala Nagar, Bengaluru, Karnataka 560001',
    averageRating: 4.3,
    priceLevel: 'moderate',
    estimatedVisitMinutes: 60,
    isActive: true,
  },
  {
    name: 'The Permit Room',
    description:
      'Modern South Indian gastropub reimagining classics like filter coffee Old-Fashioneds, dosa tacos, and chettinad cocktails in a vibrant, design-forward space.',
    category: 'restaurant',
    latitude: 13.0069,
    longitude: 77.5803,
    address: '27, Sankey Road, High Grounds, Bengaluru, Karnataka 560052',
    averageRating: 4.4,
    priceLevel: 'premium',
    estimatedVisitMinutes: 90,
    isActive: true,
  },
  {
    name: 'Brahmin\'s Coffee Bar',
    description:
      'No-frills, legendary breakfast joint serving hot idlis with coconut chutney and freshly ground filter coffee since 1965. Cash only, benches, and pure nostalgia.',
    category: 'restaurant',
    latitude: 12.9624,
    longitude: 77.5842,
    address: '4/1, Shankarapuram, Chamarajpet, Bengaluru, Karnataka 560020',
    averageRating: 4.4,
    priceLevel: 'budget',
    estimatedVisitMinutes: 30,
    isActive: true,
  },
  {
    name: 'Meghana Foods',
    description:
      'Famous for its spicy and aromatic Andhra Biryani served on banana leaves. The chicken biryani here has a devoted following across the city.',
    category: 'restaurant',
    latitude: 12.9716,
    longitude: 77.6075,
    address: '107/3, Residency Road, Bengaluru, Karnataka 560025',
    averageRating: 4.2,
    priceLevel: 'budget',
    estimatedVisitMinutes: 45,
    isActive: true,
  },

  // ── Cafes ──────────────────────────────────────────────────────────────────
  {
    name: 'Blue Tokai Coffee Roasters',
    description:
      'Speciality coffee roastery and café sourcing single-origin Indian beans. A go-to for Bengaluru\'s coffee-obsessed crowd for pour-overs, cold brews, and aeropress.',
    category: 'cafe',
    latitude: 12.9352,
    longitude: 77.6139,
    address: '5, Museum Road, Shanthala Nagar, Bengaluru, Karnataka 560025',
    averageRating: 4.5,
    priceLevel: 'moderate',
    estimatedVisitMinutes: 60,
    isActive: true,
  },
  {
    name: 'Matteo Coffea',
    description:
      'Relaxed all-day café with an exposed-brick aesthetic, great natural light, and reliable flat whites. A favourite for remote workers and students in Indiranagar.',
    category: 'cafe',
    latitude: 12.9791,
    longitude: 77.6408,
    address: '13, 3rd Cross Road, Indiranagar, Bengaluru, Karnataka 560038',
    averageRating: 4.3,
    priceLevel: 'moderate',
    estimatedVisitMinutes: 75,
    isActive: true,
  },
  {
    name: 'Third Wave Coffee',
    description:
      'Upscale specialty café chain with a focus on ethically sourced beans, stunning latte art, and a clean Scandinavian interior. Multiple Bengaluru outlets.',
    category: 'cafe',
    latitude: 12.9602,
    longitude: 77.6365,
    address: '1st Floor, 100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru 560038',
    averageRating: 4.4,
    priceLevel: 'moderate',
    estimatedVisitMinutes: 60,
    isActive: true,
  },
  {
    name: 'Koshy\'s',
    description:
      'Bengaluru\'s most storied café, open since 1940. Frequented by journalists, artists, and expats. The scrambled eggs, toast, and filter coffee are legendary.',
    category: 'cafe',
    latitude: 12.9718,
    longitude: 77.5988,
    address: '39, St Marks Road, Bengaluru, Karnataka 560001',
    averageRating: 4.1,
    priceLevel: 'budget',
    estimatedVisitMinutes: 60,
    isActive: true,
  },

  // ── Viewpoints ─────────────────────────────────────────────────────────────
  {
    name: 'Nandi Hills',
    description:
      'A scenic hill fortress at 1478 m, offering breathtaking sunrise views above cloud cover, cool temperatures, and cycling trails. 60 km north of Bengaluru.',
    category: 'viewpoint',
    latitude: 13.3702,
    longitude: 77.6835,
    address: 'Nandi Hills, Chikkaballapur District, Karnataka 562103',
    averageRating: 4.6,
    priceLevel: 'budget',
    estimatedVisitMinutes: 180,
    isActive: true,
  },
  {
    name: 'Lalbagh Rock Viewpoint',
    description:
      'An ancient 3000-million-year-old Precambrian rock formation inside Lalbagh Botanical Garden offering a 360° panoramic view of the city skyline.',
    category: 'viewpoint',
    latitude: 12.9509,
    longitude: 77.5848,
    address: 'Lalbagh Botanical Garden, Mavalli, Bengaluru, Karnataka 560004',
    averageRating: 4.2,
    priceLevel: 'budget',
    estimatedVisitMinutes: 45,
    isActive: true,
  },
  {
    name: 'Ramanagara Hills',
    description:
      'The dramatic rocky outcrops that served as the filming location for Sholay. Popular for trekking, rock climbing, and vulture spotting. 50 km from Bengaluru.',
    category: 'viewpoint',
    latitude: 12.7158,
    longitude: 77.2819,
    address: 'Ramanagara, Karnataka 562159',
    averageRating: 4.4,
    priceLevel: 'budget',
    estimatedVisitMinutes: 150,
    isActive: true,
  },

  // ── Attractions ────────────────────────────────────────────────────────────
  {
    name: 'Lalbagh Botanical Garden',
    description:
      'A 240-acre botanical garden housing over 1000 plant species, a Victorian glass house, and a serene lotus pond. Founded in the 18th century by Hyder Ali.',
    category: 'attraction',
    latitude: 12.9494,
    longitude: 77.5852,
    address: 'Lalbagh Road, Mavalli, Bengaluru, Karnataka 560004',
    averageRating: 4.5,
    priceLevel: 'budget',
    estimatedVisitMinutes: 120,
    isActive: true,
  },
  {
    name: 'Bangalore Palace',
    description:
      'A stunning Tudor-style palace built in 1887, inspired by Windsor Castle, with fortified towers, arches, and lavish interiors filled with royal artefacts.',
    category: 'attraction',
    latitude: 13.0039,
    longitude: 77.5928,
    address: 'Vasanth Nagar, Bengaluru, Karnataka 560052',
    averageRating: 4.2,
    priceLevel: 'moderate',
    estimatedVisitMinutes: 90,
    isActive: true,
  },
  {
    name: 'National Museum of Natural History (Bengaluru)',
    description:
      'Interactive science and natural history museum featuring dinosaur skeletons, wildlife dioramas, and environmental exhibits. Great for families and curious minds.',
    category: 'attraction',
    latitude: 12.9993,
    longitude: 77.5654,
    address: 'Kasturba Road, Bengaluru, Karnataka 560001',
    averageRating: 4.0,
    priceLevel: 'budget',
    estimatedVisitMinutes: 90,
    isActive: true,
  },
  {
    name: 'ISKCON Temple Bengaluru',
    description:
      'One of the largest ISKCON temples in the world, a magnificent marble complex dedicated to Radha-Krishna with stunning architecture and a peaceful atmosphere.',
    category: 'attraction',
    latitude: 13.0101,
    longitude: 77.5511,
    address: 'Chord Road, Rajajinagar, Bengaluru, Karnataka 560010',
    averageRating: 4.6,
    priceLevel: 'budget',
    estimatedVisitMinutes: 60,
    isActive: true,
  },
  {
    name: 'Cubbon Park',
    description:
      'A 300-acre green lung at the heart of Bengaluru, with heritage statues, a children\'s park, a public library, and shaded walking and cycling paths.',
    category: 'attraction',
    latitude: 12.9763,
    longitude: 77.5929,
    address: 'Kasturba Road, Ambedkar Veedhi, Bengaluru, Karnataka 560001',
    averageRating: 4.4,
    priceLevel: 'budget',
    estimatedVisitMinutes: 90,
    isActive: true,
  },
];

async function main() {
  console.log('🌱  Starting GeoBite seed…');

  let created = 0;
  let updated = 0;

  for (const place of places) {
    const result = await prisma.place.upsert({
      where: {
        // Compound unique key: name_address (defined via @@unique in schema)
        name_address: {
          name: place.name,
          address: place.address,
        },
      },
      update: {
        description: place.description,
        category: place.category,
        latitude: place.latitude,
        longitude: place.longitude,
        averageRating: place.averageRating,
        priceLevel: place.priceLevel,
        estimatedVisitMinutes: place.estimatedVisitMinutes,
        isActive: place.isActive,
      },
      create: place,
    });

    // A newly inserted row has createdAt === updatedAt (within ~1 ms)
    const wasCreated =
      Math.abs(result.createdAt.getTime() - result.updatedAt.getTime()) < 1000;
    if (wasCreated) {
      created++;
    } else {
      updated++;
    }
  }

  console.log(
    `✅  Seed complete: ${created} created, ${updated} updated. Total: ${places.length} places.`
  );
}

main()
  .catch((error) => {
    console.error('❌  Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
