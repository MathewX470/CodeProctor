import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Bell, Trophy, Mail, ShieldAlert, Code2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  const notifications = await prisma.notificationRecipient.findMany({
    where: { userId: session.user.id },
    include: { notification: true },
    orderBy: { notification: { createdAt: "desc" } },
    take: 50,
  });

  // Automatically mark as read in the background
  if (notifications.some(n => !n.isRead)) {
    prisma.notificationRecipient.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() }
    }).catch(console.error);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-500" />
            Notifications
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">
            Stay updated with your latest alerts, invitations, and results.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl shadow-sm dark:shadow-none overflow-hidden">
        <div className="divide-y divide-slate-200 dark:divide-zinc-800">
          {notifications.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-500 dark:text-zinc-400">
              <Bell className="w-12 h-12 mx-auto text-slate-300 dark:text-zinc-600 mb-4 opacity-50" />
              You're all caught up! No notifications yet.
            </div>
          )}
          {notifications.map((record) => {
            const notif = record.notification;
            
            let Icon = Bell;
            let iconColor = "text-blue-500 bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20";
            
            if (notif.type === "CONTEST_STARTED") {
              Icon = Trophy;
              iconColor = "text-amber-500 bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20";
            } else if (notif.type === "INVITATION") {
              Icon = Mail;
              iconColor = "text-purple-500 bg-purple-50 border-purple-100 dark:bg-purple-500/10 dark:border-purple-500/20";
            } else if (notif.type === "DISQUALIFICATION") {
              Icon = ShieldAlert;
              iconColor = "text-red-500 bg-red-50 border-red-100 dark:bg-red-500/10 dark:border-red-500/20";
            } else if (notif.type === "SUBMISSION_JUDGED") {
              Icon = Code2;
              iconColor = "text-emerald-500 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20";
            }

            return (
              <div key={record.id} className={`p-6 transition-colors flex gap-4 ${!record.isRead ? "bg-slate-50/50 dark:bg-zinc-800/20" : ""}`}>
                <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center border ${iconColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <h3 className={`font-semibold text-slate-900 dark:text-white ${!record.isRead ? "font-bold" : ""}`}>
                      {notif.title}
                    </h3>
                    <span className="text-xs font-medium text-slate-400 dark:text-zinc-500 whitespace-nowrap">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-300 text-sm">
                    {notif.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
