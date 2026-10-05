import { getSessionWithRoles } from "@/app/actions/auth";
import { getTagsServer } from "@/app/actions/admin/tags";
import { getLanguagesServer, getProblemBySlugServer } from "@/app/actions/admin/problems";
import { ProblemForm } from "@/app/(admin)/admin/problems/ProblemForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function UserEditProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { session } = await getSessionWithRoles();
  
  if (!session?.user) {
    redirect("/login");
  }

  let problem;
  try {
    // getProblemBySlugServer now allows access if the user is the creator
    problem = await getProblemBySlugServer(slug);
  } catch (e) {
    notFound();
  }

  const [tags, languages] = await Promise.all([
    getTagsServer(),
    getLanguagesServer()
  ]);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        {/* We can provide a button to go back. Since it was likely accessed from a contest, maybe we just do a generic back. */}
        <Link 
          href="/contests"
          className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Customize Problem: {problem.title}</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Modify the test cases and templates for this private problem.
          </p>
        </div>
      </div>

      <ProblemForm 
        initialTags={tags} 
        initialLanguages={languages} 
        initialData={problem} 
        problemId={problem.id} 
        isAdmin={false}
      />
    </div>
  );
}
