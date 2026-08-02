import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL || "",
});
const prisma = new PrismaClient({ adapter });

const DEFAULT_ROLES = [
  { name: "SUPER_ADMIN", description: "Full unrestricted access to everything" },
  { name: "ADMIN", description: "Base access to the admin portal" },
  { name: "RBAC_USERS", description: "Permission to manage users and roles" },
  { name: "RBAC_CONTESTS", description: "Permission to manage global contests" },
  { name: "RBAC_PROBLEMS", description: "Permission to manage the global problem bank" },
  { name: "RBAC_ANNOUNCEMENTS", description: "Permission to manage global announcements" },
  { name: "RBAC_ANALYTICS", description: "Permission to view platform analytics" }
];

async function main() {
  console.log("Seeding roles...");
  
  for (const role of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: { name: role.name, description: role.description },
    });
  }
  
  console.log("Roles seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
