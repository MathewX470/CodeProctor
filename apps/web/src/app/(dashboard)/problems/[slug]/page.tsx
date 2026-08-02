import React from "react";
import { getPublicProblemBySlugServer } from "@/app/actions/problems";
import { ProblemIDE } from "./ProblemIDE";
import { notFound } from "next/navigation";

export default async function PublicProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  let problem;
  try {
    problem = await getPublicProblemBySlugServer(slug);
  } catch (e) {
    notFound();
  }

  return (
    <ProblemIDE problem={problem} />
  );
}
