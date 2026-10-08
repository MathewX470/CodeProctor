"use server";

import { getSessionWithRoles } from "./auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPlatformSettingsServer() {
  try {
    const setting = await prisma.platformSetting.findUnique({
      where: { id: "global" }
    });
    
    if (setting) {
      return setting;
    }
  } catch (err) {
    console.error("Database error in settings:", err);
  }
  
  return {
    platformName: "CodeProctor",
    supportEmail: "support@codeproctor.dev",
    requireVerification: true,
    allowPublicRegistration: true,
    maintenanceMode: false,
  };
}

export async function savePlatformSettingsServer(data: any) {
  const session = await getSessionWithRoles();
  if (!session?.isSuperAdmin) {
    return { error: "Forbidden: Only SuperAdmins can modify global platform settings." };
  }

  await prisma.platformSetting.upsert({
    where: { id: "global" },
    update: data,
    create: { id: "global", ...data },
  });
  
  revalidatePath("/"); // Revalidate everything since these are global settings

  return { success: true };
}
