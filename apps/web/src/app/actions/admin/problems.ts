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

export async function getProblemBySlugServer(slug: string) {
  const { isSuperAdmin, permissions } = await getSessionWithRoles();
  
  if (!isSuperAdmin && !permissions.includes("RBAC_PROBLEMS")) {
    throw new Error("Unauthorized");
  }

  const problem = await prisma.problem.findUnique({
    where: { slug },
    include: {
      problemTags: true,
      testCases: { orderBy: { createdAt: 'asc' } },
      samples: { orderBy: { order: 'asc' } },
      languageTemplates: true
    }
  });

  if (!problem) throw new Error("Problem not found");

  return {
    ...problem,
    tagIds: problem.problemTags.map(pt => pt.tagId),
    templates: problem.languageTemplates
  };
}
export async function getLanguagesServer() {
  const { session } = await getSessionWithRoles();
  
  if (!session?.user) {
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
  testCases: { id?: string; input: string; expectedOutput: string; isHidden: boolean; weight: number }[];
  samples: { id?: string; input: string; expectedOutput: string; explanation: string; order: number }[];
  templates: { id?: string; languageId: string; boilerplate: string; }[];
};

export type UpdateProblemInput = CreateProblemInput;

export async function createProblemServer(data: CreateProblemInput) {
  const { session, isSuperAdmin, permissions } = await getSessionWithRoles();
  
  if (!session?.user) throw new Error("Unauthorized");
  
  const hasAdminPerm = isSuperAdmin || permissions.includes("RBAC_PROBLEMS");
  if (!hasAdminPerm) {
    if (data.isPublic) {
      throw new Error("Standard users cannot create public problems.");
    }
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

export async function updateProblemServer(id: string, data: UpdateProblemInput) {
  const { session, isSuperAdmin, permissions } = await getSessionWithRoles();
  if (!session?.user) throw new Error("Unauthorized");

  const problem = await prisma.problem.findUnique({ where: { id } });
  if (!problem) throw new Error("Problem not found");

  const hasAdminPerm = isSuperAdmin || permissions.includes("RBAC_PROBLEMS");
  if (!hasAdminPerm) {
    if (problem.createdById !== session.user.id) {
      throw new Error("You can only edit problems you created.");
    }
    if (data.isPublic) {
      throw new Error("Standard users cannot make problems public.");
    }
  }

  // Check if slug exists and belongs to another problem
  const existing = await prisma.problem.findUnique({ where: { slug: data.slug } });
  if (existing && existing.id !== id) {
    throw new Error("A problem with this slug already exists.");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Update basic info
    await tx.problem.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        difficulty: data.difficulty,
        timeLimit: data.timeLimit,
        memoryLimit: data.memoryLimit,
        isPublic: data.isPublic,
        description: data.description,
      }
    });

    // 2. Update Tags (delete all, insert new)
    await tx.problemTag.deleteMany({ where: { problemId: id } });
    if (data.tagIds.length > 0) {
      await tx.problemTag.createMany({
        data: data.tagIds.map(tagId => ({
          problemId: id,
          tagId
        }))
      });
    }

    // 3. Update Test Cases
    // Delete test cases that are not in the new list (this will cascade delete submission test cases if any exist)
    const existingTestCases = await tx.testCase.findMany({ where: { problemId: id } });
    const incomingTestCaseIds = data.testCases.map(tc => tc.id).filter(Boolean) as string[];
    const testCasesToDelete = existingTestCases.filter(tc => !incomingTestCaseIds.includes(tc.id));
    
    if (testCasesToDelete.length > 0) {
      await tx.testCase.deleteMany({
        where: { id: { in: testCasesToDelete.map(tc => tc.id) } }
      });
    }

    // Upsert test cases
    for (const tc of data.testCases) {
      if (tc.id) {
        await tx.testCase.update({
          where: { id: tc.id },
          data: {
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: tc.isHidden,
            weight: tc.weight
          }
        });
      } else {
        await tx.testCase.create({
          data: {
            problemId: id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: tc.isHidden,
            weight: tc.weight
          }
        });
      }
    }

    // 4. Update Samples
    await tx.problemSample.deleteMany({ where: { problemId: id } });
    if (data.samples.length > 0) {
      await tx.problemSample.createMany({
        data: data.samples.map(sample => ({
          problemId: id,
          input: sample.input,
          expectedOutput: sample.expectedOutput,
          explanation: sample.explanation || "",
          order: sample.order
        }))
      });
    }

    // 5. Update Language Templates
    await tx.languageTemplate.deleteMany({ where: { problemId: id } });
    if (data.templates && data.templates.length > 0) {
      await tx.languageTemplate.createMany({
        data: data.templates.map(t => ({
          problemId: id,
          languageId: t.languageId,
          boilerplate: t.boilerplate
        }))
      });
    }
  });

  revalidatePath("/admin/problems");
  revalidatePath(`/admin/problems/${data.slug}`);
  return { success: true };
}

export async function archiveProblemServer(problemId: string) {
  const { session, isSuperAdmin, permissions } = await getSessionWithRoles();
  if (!session?.user) throw new Error("Unauthorized");
  
  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem) throw new Error("Problem not found");

  const hasAdminPerm = isSuperAdmin || permissions.includes("RBAC_PROBLEMS");
  if (!hasAdminPerm) {
    if (problem.createdById !== session.user.id) {
      throw new Error("You can only delete problems you created.");
    }
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
