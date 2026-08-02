import { getSessionWithRoles } from "@/app/actions/auth";
import { AccessDenied } from "../../components/AccessDenied";
import { getTagsServer } from "@/app/actions/admin/tags";
import { getLanguagesServer, getProblemBySlugServer } from "@/app/actions/admin/problems";
import { ProblemForm } from "../ProblemForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminEditProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { isSuperAdmin, permissions } = await getSessionWithRoles();
  
  if (!isSuperAdmin && !permissions.includes("RBAC_PROBLEMS")) {
    return <AccessDenied message="You need the 'Manage Problems' permission to view this page." />;
  }

  let problem;
  try {
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
        <Link 
          href="/admin/problems"
          className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Problem: {problem.title}</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Modify the details, test cases, and templates for this problem.
          </p>
        </div>
      </div>

      <ProblemForm 
        initialTags={tags} 
        initialLanguages={languages} 
        initialData={problem} 
        problemId={problem.id} 
      />
    </div>
  );
}
