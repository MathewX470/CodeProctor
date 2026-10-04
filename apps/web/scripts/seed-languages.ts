import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL || "",
});
const prisma = new PrismaClient({ adapter });

const DEFAULT_LANGUAGES = [
  { slug: 'python3', name: 'Python 3.11', dockerImage: 'codeproctor-python3' },
  { slug: 'javascript', name: 'Node.js 20', dockerImage: 'codeproctor-javascript' },
  { slug: 'c', name: 'C (GCC 12)', dockerImage: 'codeproctor-c' },
  { slug: 'cpp', name: 'C++ (GCC 12)', dockerImage: 'codeproctor-cpp' },
  { slug: 'java', name: 'Java 21', dockerImage: 'codeproctor-java' }
];

async function main() {
  console.log("Seeding languages...");
  
  for (const lang of DEFAULT_LANGUAGES) {
    await prisma.language.upsert({
      where: { slug: lang.slug },
      update: {
        name: lang.name,
        dockerImage: lang.dockerImage,
        isActive: true
      },
      create: {
        slug: lang.slug,
        name: lang.name,
        dockerImage: lang.dockerImage,
        isActive: true
      },
    });
    console.log(`Upserted language: ${lang.name}`);
  }
  
  console.log("Languages seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
