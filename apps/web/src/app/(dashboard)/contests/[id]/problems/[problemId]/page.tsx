import React from "react";
import { getProblemForArenaServer } from "@/app/actions/contests";
import { ArenaIDE } from "@/components/contests/ArenaIDE";
import { redirect } from "next/navigation";

export default async function ArenaProblemPage(props: { params: Promise<{ id: string, problemId: string }> }) {
  const params = await props.params;
  console.log("=== ArenaProblemPage hit ===", params);
  let data;
  try {
    data = await getProblemForArenaServer(params.id, params.problemId);
  } catch (e: any) {
    console.error("=== ArenaProblemPage caught error ===", e.message);
    if (
      e.message.includes("Unauthorized") || 
      e.message.includes("Contest not started") || 
      e.message.includes("Not a member") ||
      e.message.includes("Contest creators") ||
      e.message.includes("Contest has ended") ||
      e.message.includes("Forbidden") ||
      e.message.includes("Disqualified")
    ) {
      redirect(`/contests/${params.id}`);
    }
    throw e;
  }

  if (data.isDisqualified) {
    redirect(`/contests/${params.id}`);
  }

  return (
    <div className="h-full w-full overflow-hidden">
      <ArenaIDE 
        problem={data.problem} 
        contestId={params.id} 
        userEndTime={data.userEndTime} 
        allProblems={data.allProblems} 
        userId={data.userId}
        settings={data.settings}
        violationCount={data.violationCount}
        isDisqualified={data.isDisqualified}
        disqualifiedReason={data.disqualifiedReason}
      />
    </div>
  );
}
