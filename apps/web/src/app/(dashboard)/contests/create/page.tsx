import React from "react";
import { ContestForm } from "@/components/contests/ContestForm";
import { getSessionWithRoles } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function CreateUserContestPage() {
  const session = await getSessionWithRoles();
  if (!session.session?.user) {
    redirect("/login");
  }

  // We pass isAdmin=false so the form forces the contest to be Private
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/contests"
          className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Private Contest</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Host a private coding competition for your friends or classmates.
          </p>
        </div>
      </div>

      <ContestForm isAdmin={false} redirectPath="/contests" />
    </div>
  );
}
