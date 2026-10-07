import React from "react";
import { getPlatformSettingsServer } from "@/app/actions/admin-settings";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default async function SignUpLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPlatformSettingsServer();
  
  if (!settings.allowPublicRegistration) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-white/[0.03] border border-white/[0.06] p-10 rounded-3xl max-w-md shadow-2xl backdrop-blur-md">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Registration Disabled</h1>
          <p className="text-zinc-400 text-sm">
            The platform administrator has currently disabled public registration. 
            Please contact support or try again later.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
