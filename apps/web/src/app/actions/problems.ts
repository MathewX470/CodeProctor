"use server";

import { prisma } from "@/lib/prisma";
import { getSessionWithRoles } from "./auth";

export async function getPublicProblemBySlugServer(slug: string) {
  const { isSuperAdmin, permissions } = await getSessionWithRoles();
  const isAdmin = isSuperAdmin || permissions.includes("RBAC_PROBLEMS");

  // Fetch the problem
  const problem = await prisma.problem.findUnique({
    where: { slug },
    include: {
      problemTags: {
        include: { tag: true }
      },
      samples: {
        orderBy: { order: "asc" }
      },
      languageTemplates: {
        include: { language: true }
      }
    }
  });

  if (!problem) throw new Error("Problem not found");
  if (problem.isDeleted) throw new Error("Problem not found");
  
  // If not public, only admins can view
  if (!problem.isPublic && !isAdmin) {
    throw new Error("Problem not found");
  }

  // Fetch all supported languages so users can select any language even if no template exists
  const allLanguages = await prisma.language.findMany();

  // Format the data for the public IDE
  // NOTICE: We specifically DO NOT fetch `testCases` here to prevent cheating.
  return {
    id: problem.id,
    title: problem.title,
    slug: problem.slug,
    description: problem.description,
    difficulty: problem.difficulty,
    timeLimit: problem.timeLimit,
    memoryLimit: problem.memoryLimit,
    isPublic: problem.isPublic,
    tags: problem.problemTags.map(pt => pt.tag.name),
    samples: problem.samples,
    templates: problem.languageTemplates.map(lt => ({
      id: lt.id,
      languageId: lt.language.id,
      languageName: lt.language.name,
      slug: lt.language.slug,
      boilerplate: lt.boilerplate
    })),
    allLanguages: allLanguages.map(l => ({
      id: l.id,
      name: l.name,
      slug: l.slug
    }))
  };
}
