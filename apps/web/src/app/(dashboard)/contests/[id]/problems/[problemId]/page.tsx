import React from "react";
import { getProblemForArenaServer } from "@/app/actions/contests";
import { ArenaIDE } from "@/components/contests/ArenaIDE";
import { redirect } from "next/navigation";

export default async function ArenaProblemPage(props: { params: Promise<{ id: string, problemId: string }> }) {
  const params = await props.params;
  let data;
  try {
    data = await getProblemForArenaServer(params.id, params.problemId);
  } catch (e: any) {
    if (
      e.message.includes("Unauthorized") || 
      e.message.includes("Contest not started") || 
      e.message.includes("Not a member") ||
      e.message.includes("Contest creators") ||
      e.message.includes("Contest has ended") ||
      e.message.includes("Forbidden")
    ) {
      redirect(`/contests/${params.id}`);
    }
    throw e;
  }

  return (
    <div className="h-[calc(100vh-64px)] w-full overflow-hidden">
      <ArenaIDE problem={data.problem} contestId={params.id} userEndTime={data.userEndTime} allProblems={data.allProblems} />
    </div>
  );
}
