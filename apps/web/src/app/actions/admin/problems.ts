"use server";

import { prisma } from "@/lib/prisma";
import { getSessionWithRoles } from "../auth";
import { revalidatePath } from "next/cache";

export async function getAdminProblemsServer() {
  const { isSuperAdmin, permissions } = await getSessionWithRoles();
  
  if (!isSuperAdmin && !permissions.includes("RBAC_PROBLEMS")) {
    throw new Error("Unauthorized");
  }

  const problems = await prisma.problem.findMany({
    where: { isDeleted: false },
    include: {
      createdBy: {
        select: { name: true, email: true }
      },
      problemTags: {
        include: { tag: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return problems.map(p => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    difficulty: p.difficulty,
    isPublic: p.isPublic,
    timeLimit: p.timeLimit,
    memoryLimit: p.memoryLimit,
    createdAt: p.createdAt,
    author: p.createdBy.name || p.createdBy.email,
    tags: p.problemTags.map(pt => pt.tag.name)
  }));
}

export async function getLanguagesServer() {
  const { isSuperAdmin, permissions } = await getSessionWithRoles();
  
  if (!isSuperAdmin && !permissions.includes("RBAC_PROBLEMS")) {
    throw new Error("Unauthorized");
  }

  const languages = await prisma.language.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  });

  return languages.map(l => ({ id: l.id, name: l.name, slug: l.slug }));
}
export type CreateProblemInput = {
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  timeLimit: number;
  memoryLimit: number;
  isPublic: boolean;
  description: string;
  tagIds: string[];
  testCases: { input: string; expectedOutput: string; isHidden: boolean; weight: number }[];
  samples: { input: string; expectedOutput: string; explanation: string; order: number }[];
  templates: { languageId: string; boilerplate: string }[];
};

export async function createProblemServer(data: CreateProblemInput) {
  const { session, isSuperAdmin, permissions } = await getSessionWithRoles();
  
  if (!session?.user || (!isSuperAdmin && !permissions.includes("RBAC_PROBLEMS"))) {
    throw new Error("Unauthorized");
  }

  // Check if slug exists
  const existing = await prisma.problem.findUnique({ where: { slug: data.slug } });
  if (existing) {
    throw new Error("A problem with this slug already exists.");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Create Problem
    const problem = await tx.problem.create({
      data: {
        title: data.title,
        slug: data.slug,
        difficulty: data.difficulty,
        timeLimit: data.timeLimit,
        memoryLimit: data.memoryLimit,
        isPublic: data.isPublic,
        description: data.description,
        createdById: session.user.id
      }
    });

    // 2. Link Tags
    if (data.tagIds.length > 0) {
      await tx.problemTag.createMany({
        data: data.tagIds.map(tagId => ({
          problemId: problem.id,
          tagId
        }))
      });
    }

    // 3. Create Test Cases
    if (data.testCases.length > 0) {
      await tx.testCase.createMany({
        data: data.testCases.map(tc => ({
          problemId: problem.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden,
          weight: tc.weight
        }))
      });
    }

    // 4. Create Samples
    if (data.samples.length > 0) {
      await tx.problemSample.createMany({
        data: data.samples.map(sample => ({
          problemId: problem.id,
          input: sample.input,
          expectedOutput: sample.expectedOutput,
          explanation: sample.explanation,
          order: sample.order
        }))
      });
    }

    // 5. Create Language Templates
    if (data.templates && data.templates.length > 0) {
      await tx.languageTemplate.createMany({
        data: data.templates.map(t => ({
          problemId: problem.id,
          languageId: t.languageId,
          boilerplate: t.boilerplate
        }))
      });
    }
  });

  revalidatePath("/admin/problems");
  return { success: true };
}

export async function archiveProblemServer(problemId: string) {
  const { isSuperAdmin, permissions } = await getSessionWithRoles();
  
  if (!isSuperAdmin && !permissions.includes("RBAC_PROBLEMS")) {
    throw new Error("Unauthorized");
  }

  await prisma.problem.update({
    where: { id: problemId },
    data: { isDeleted: true }
  });

  revalidatePath("/admin/problems");
  return { success: true };
}

export async function toggleProblemVisibilityServer(problemId: string, isPublic: boolean) {
  const { isSuperAdmin, permissions } = await getSessionWithRoles();
  
  if (!isSuperAdmin && !permissions.includes("RBAC_PROBLEMS")) {
    throw new Error("Unauthorized");
  }

  await prisma.problem.update({
    where: { id: problemId },
    data: { isPublic }
  });

  revalidatePath("/admin/problems");
  return { success: true };
}
