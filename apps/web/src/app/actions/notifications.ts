"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function getNotifications() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || !session.user) {
    return { error: "Unauthorized" };
  }

  const notifications = await prisma.notificationRecipient.findMany({
    where: { userId: session.user.id },
    include: { notification: true },
    orderBy: { notification: { createdAt: "desc" } },
    take: 10,
  });

  return { notifications };
}

export async function markNotificationsAsRead() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || !session.user) return;

  await prisma.notificationRecipient.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true, readAt: new Date() }
  });
}
