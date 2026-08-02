"use server";

import { prisma } from "@/lib/prisma";
import { getSessionWithRoles } from "../auth";
import { revalidatePath } from "next/cache";

export async function getAdminUsersServer() {
  const { isSuperAdmin, permissions } = await getSessionWithRoles();
  
  if (!isSuperAdmin && !permissions.includes("RBAC_USERS")) {
    throw new Error("Unauthorized");
  }

  const users = await prisma.user.findMany({
    include: {
      userRoles: {
        include: {
          role: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    createdAt: u.createdAt,
    roles: u.userRoles.map(ur => ur.role.name)
  }));
}

export async function updateUserRolesServer(userId: string, rolesToAssign: string[]) {
  const { isSuperAdmin, permissions } = await getSessionWithRoles();
  
  if (!isSuperAdmin && !permissions.includes("RBAC_USERS")) {
    throw new Error("Unauthorized");
  }

  // 1. Get role IDs for the requested roles
  const roles = await prisma.role.findMany({
    where: { name: { in: rolesToAssign } }
  });

  // 2. Perform a transaction: delete old roles and create new ones
  await prisma.$transaction(async (tx) => {
    // Delete all existing roles for this user
    await tx.userRole.deleteMany({
      where: { userId }
    });

    // Assign the new roles
    if (roles.length > 0) {
      await tx.userRole.createMany({
        data: roles.map(role => ({
          userId,
          roleId: role.id
        }))
      });
    }
  });

  revalidatePath("/admin/users");
  return { success: true };
}
