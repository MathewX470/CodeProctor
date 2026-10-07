"use server";

import { prisma } from "@/lib/prisma";
import { getSessionWithRoles } from "./auth";
import { revalidatePath } from "next/cache";

export async function getAdminAnnouncementsServer() {
  const session = await getSessionWithRoles();
  if (!session.isSuperAdmin && !session.permissions.includes("RBAC_ANNOUNCEMENTS")) {
    throw new Error("Forbidden");
  }

  const announcements = await prisma.notification.findMany({
    where: { type: "PLATFORM_ANNOUNCEMENT" },
    orderBy: { createdAt: "desc" }
  });

  return announcements.map((a: any) => ({
    id: a.id,
    title: a.title,
    message: a.message,
    type: a.metadata?.announcementType || "Update",
    author: a.metadata?.author || "System Admin",
    date: a.createdAt.toISOString().split("T")[0]
  }));
}

export async function createAnnouncementServer(data: {
  title: string;
  message: string;
  announcementType: string;
}) {
  const session = await getSessionWithRoles();
  if (!session.isSuperAdmin && !session.permissions.includes("RBAC_ANNOUNCEMENTS")) {
    return { error: "Forbidden" };
  }
  
  if (!session.session?.user) return { error: "Unauthorized" };

  try {
    const notification = await prisma.notification.create({
      data: {
        type: "PLATFORM_ANNOUNCEMENT",
        title: data.title,
        message: data.message,
        metadata: {
          announcementType: data.announcementType,
          author: session.session.user.name || "System Admin"
        }
      }
    });

    // Fan-out to all users (in a real massive app this should be batched or done via SQS)
    const users = await prisma.user.findMany({ select: { id: true } });
    
    await prisma.notificationRecipient.createMany({
      data: users.map(u => ({
        notificationId: notification.id,
        userId: u.id,
        isRead: false
      }))
    });

    revalidatePath("/admin/announcements");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteAnnouncementServer(id: string) {
  const session = await getSessionWithRoles();
  if (!session.isSuperAdmin && !session.permissions.includes("RBAC_ANNOUNCEMENTS")) {
    return { error: "Forbidden" };
  }

  try {
    // This will cascade delete NotificationRecipient
    await prisma.notification.delete({
      where: { id }
    });
    revalidatePath("/admin/announcements");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
