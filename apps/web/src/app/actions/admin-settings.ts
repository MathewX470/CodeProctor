"use server";

import { getSessionWithRoles } from "./auth";
import { redis } from "@/lib/redis";
import { revalidatePath } from "next/cache";

export async function getPlatformSettingsServer() {
  try {
    const fetchPromise = redis.get("platform:settings");
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Redis timeout")), 1000)
    );
    
    // Type assert the result to string | null since we know redis.get returns this
    const settings = (await Promise.race([fetchPromise, timeoutPromise])) as string | null;
    if (settings) return JSON.parse(settings);
  } catch (err) {
    console.error("Redis connection/timeout error in settings:", err);
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
  if (!session.isSuperAdmin) {
    return { error: "Forbidden: Only SuperAdmins can modify global platform settings." };
  }

  await redis.set("platform:settings", JSON.stringify(data));
  revalidatePath("/"); // Revalidate everything since these are global settings

  return { success: true };
}
