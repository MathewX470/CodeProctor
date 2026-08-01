import "dotenv/config";
import { auth } from "./src/lib/auth";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL || "",
});
const prisma = new PrismaClient({ adapter });

async function createSuperAdmin() {
  console.log("Initializing Super Admin creation...");

  try {
    // 1. Ensure the SUPER_ADMIN role exists
    const adminRole = await prisma.role.upsert({
      where: { name: "SUPER_ADMIN" },
      update: {},
      create: { name: "SUPER_ADMIN", description: "Platform Super Administrator" }
    });
    console.log("✔ SUPER_ADMIN role verified.");

    const email = "mathewpunnen8281@gmail.com";
    const password = "Superadmin123";

    // Check if it already exists to avoid errors
    const existing = await prisma.user.findUnique({ where: { email } });
    let userId = existing?.id;

    if (!existing) {
      // 2. Create the user through BetterAuth (handles password hashing)
      console.log("Registering Super Admin via BetterAuth...");
      const res = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: "Mathew",
        }
      });
      
      if (res?.user) {
        userId = res.user.id;
        // Mark email as verified
        await prisma.user.update({
          where: { id: userId },
          data: { emailVerified: true }
        });
        console.log("✔ BetterAuth registration complete.");
      } else {
        throw new Error("BetterAuth failed to return user data.");
      }
    } else {
      console.log("✔ User already exists, skipping BetterAuth registration.");
    }

    // 3. Attach the SUPER_ADMIN role to the user
    if (userId) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId,
            roleId: adminRole.id
          }
        },
        update: {},
        create: {
          userId,
          roleId: adminRole.id
        }
      });
      console.log(`\n🎉 Super Admin account is ready!`);
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
    }

  } catch (error) {
    console.error("Failed to create super admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
