"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getSessionWithRoles() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  if (!session?.user) return { session: null, isSuperAdmin: false, isAdmin: false, permissions: [] as string[] };
  
  const userRoles = await prisma.userRole.findMany({
    where: { userId: session.user.id },
    include: { role: true }
  });
  
  const roleNames = userRoles.map(ur => ur.role.name);
  
  const isSuperAdmin = roleNames.includes("SUPER_ADMIN");
  const isAdmin = isSuperAdmin || roleNames.includes("ADMIN");
  
  return {
    session,
    isSuperAdmin,
    isAdmin,
    permissions: roleNames
  };
}

export async function getUserRoleServer() {
  const { isAdmin } = await getSessionWithRoles();
  return isAdmin ? "ADMIN" : "USER";
}
