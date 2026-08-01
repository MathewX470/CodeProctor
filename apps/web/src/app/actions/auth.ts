"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getUserRoleServer() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  if (!session?.user) return "GUEST";
  
  const userRole = await prisma.userRole.findFirst({
    where: { userId: session.user.id },
    include: { role: true }
  });
  
  if (userRole?.role?.name === "SUPER_ADMIN" || userRole?.role?.name === "ADMIN") {
    return "ADMIN";
  }
  return "USER";
}
