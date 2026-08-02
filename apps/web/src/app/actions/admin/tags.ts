"use server";

import { prisma } from "@/lib/prisma";
import { getSessionWithRoles } from "../auth";

export async function getTagsServer() {
  const { isSuperAdmin, permissions } = await getSessionWithRoles();
  
  if (!isSuperAdmin && !permissions.includes("RBAC_PROBLEMS")) {
    throw new Error("Unauthorized");
  }

  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' }
  });

  return tags;
}

export async function getTagsWithCountsServer() {
  const { isSuperAdmin, permissions } = await getSessionWithRoles();
  
  if (!isSuperAdmin && !permissions.includes("RBAC_PROBLEMS")) {
    throw new Error("Unauthorized");
  }

  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: { problemTags: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  return tags.map(t => ({
    id: t.id,
    name: t.name,
    problemCount: t._count.problemTags
  }));
}

export async function createTagServer(name: string) {
  const { isSuperAdmin, permissions } = await getSessionWithRoles();
  
  if (!isSuperAdmin && !permissions.includes("RBAC_PROBLEMS")) {
    throw new Error("Unauthorized");
  }

  const tag = await prisma.tag.upsert({
    where: { name: name.trim() },
    update: {},
    create: { name: name.trim() }
  });

  return tag;
}

export async function updateTagServer(id: string, name: string) {
  const { isSuperAdmin, permissions } = await getSessionWithRoles();
  
  if (!isSuperAdmin && !permissions.includes("RBAC_PROBLEMS")) {
    throw new Error("Unauthorized");
  }

  const tag = await prisma.tag.update({
    where: { id },
    data: { name: name.trim() }
  });

  return tag;
}

export async function deleteTagServer(id: string) {
  const { isSuperAdmin, permissions } = await getSessionWithRoles();
  
  if (!isSuperAdmin && !permissions.includes("RBAC_PROBLEMS")) {
    throw new Error("Unauthorized");
  }

  await prisma.tag.delete({
    where: { id }
  });

  return { success: true };
}
