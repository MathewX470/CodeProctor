import React from "react";
import { getSessionWithRoles } from "@/app/actions/auth";
import { getTagsServer } from "@/app/actions/admin/tags";
import { getLanguagesServer } from "@/app/actions/admin/problems";
import { ProblemForm } from "@/app/(admin)/admin/problems/ProblemForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function UserCreateProblemPage() {
  const session = await getSessionWithRoles();
  
  if (!session.session?.user) {
    redirect("/login");
  }

  const [tags, languages] = await Promise.all([
    getTagsServer(),
    getLanguagesServer()
  ]);

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Custom Problem</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Author a private problem to use in your contests.
          </p>
        </div>
      </div>

      <ProblemForm 
        initialTags={tags} 
        initialLanguages={languages} 
        isAdmin={false} 
      />
    </div>
  );
}
