import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";
import { getPlatformSettingsServer } from "@/app/actions/admin-settings";
import { getSessionWithRoles } from "@/app/actions/auth";
import { MaintenanceScreen } from "@/components/MaintenanceScreen";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeProctor - Precision Coding Assessments & Explainable Proctoring",
  description: "Integrating competitive programming with transparent, non-intrusive chronological proctoring timelines.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getPlatformSettingsServer();
  let showMaintenance = false;
  
  if (settings.maintenanceMode) {
    const session = await getSessionWithRoles();
    if (!session.isSuperAdmin) {
      showMaintenance = true;
    }
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${inter.variable} ${jetbrainsMono.variable} antialiased selection:bg-zinc-800 selection:text-emerald-400`}
    >
      <body suppressHydrationWarning className="bg-background text-on-background font-body-base antialiased min-h-screen flex flex-col overflow-x-hidden">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {showMaintenance ? <MaintenanceScreen /> : children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
