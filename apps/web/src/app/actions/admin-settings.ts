"use server";

import { getSessionWithRoles } from "./auth";
import { redis } from "@/lib/redis";
import { revalidatePath } from "next/cache";

export async function getPlatformSettingsServer() {
  const settings = await redis.get("platform:settings");
  if (settings) return JSON.parse(settings);
  
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
  if (!session.isSuperAdmin) {
    return { error: "Forbidden: Only SuperAdmins can modify global platform settings." };
  }

  await redis.set("platform:settings", JSON.stringify(data));
  revalidatePath("/"); // Revalidate everything since these are global settings

  return { success: true };
}
