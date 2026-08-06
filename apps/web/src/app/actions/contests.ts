"use server";

import { prisma } from "@/lib/prisma";
import { getSessionWithRoles } from "./auth";
import { revalidatePath } from "next/cache";
import { ProctoringMode } from "@prisma/client";

export type CreateContestInput = {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  isPublic: boolean;
  proctoringMode: ProctoringMode;
  password?: string;
};

export async function createContestServer(data: CreateContestInput) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) {
    throw new Error("Unauthorized");
  }

  // Enforcement: Standard users cannot create public contests
  if (data.isPublic) {
    if (!session.isSuperAdmin && !session.permissions.includes("RBAC_CONTESTS")) {
      throw new Error("Forbidden: Standard users cannot create public contests.");
    }
  }

  try {
    const contest = await prisma.$transaction(async (tx) => {
      // 1. Create the base contest
      const newContest = await tx.contest.create({
        data: {
          title: data.title,
          description: data.description || "",
          startTime: data.startTime,
          endTime: data.endTime,
          duration: data.duration,
          isDeleted: false,
        },
      });

      // 2. Create the settings for the contest
      await tx.contestSettings.create({
        data: {
          contestId: newContest.id,
          proctoringMode: data.proctoringMode,
          isPublic: data.isPublic,
          password: data.password || null,
          allowLateJoin: true, // Configurable later if needed
        },
      });

      // 3. Attach the creator as the OWNER member
      await tx.contestMember.create({
        data: {
          contestId: newContest.id,
          userId: session.session!.user.id,
          role: "OWNER",
        },
      });

      return newContest;
    });

    revalidatePath("/admin/contests");
    revalidatePath("/contests");

    return { success: true, contestId: contest.id };
  } catch (error: any) {
    console.error("Failed to create contest:", error);
    return { success: false, error: error.message };
  }
}

export async function getUserContestsServer() {
  const session = await getSessionWithRoles();
  if (!session.session?.user) return [];

  const memberships = await prisma.contestMember.findMany({
    where: { userId: session.session.user.id },
    include: {
      contest: {
        include: {
          settings: true,
          _count: {
            select: { 
              members: { where: { role: "PARTICIPANT" } },
              problems: true 
            }
          }
        }
      }
    },
    orderBy: {
      contest: { startTime: 'desc' }
    }
  });

  return memberships;
}

export async function getAdminContestsServer() {
  const session = await getSessionWithRoles();
  if (!session.isSuperAdmin && !session.permissions.includes("RBAC_CONTESTS")) {
    throw new Error("Forbidden");
  }

  const contests = await prisma.contest.findMany({
    include: {
      _count: {
        select: { members: { where: { role: "PARTICIPANT" } } }
      },
      members: {
        where: { role: "OWNER" },
        include: { user: { select: { name: true } } },
        take: 1
      },
      settings: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return contests.map(c => {
    let status = "Ended";
    const now = new Date();
    if (new Date(c.startTime) > now) status = "Upcoming";
    else if (new Date(c.startTime) <= now && new Date(c.endTime) >= now) status = "Active";

    return {
      id: c.id,
      name: c.title,
      creator: c.members[0]?.user.name || "Unknown",
      participants: c._count.members,
      status,
      created: c.createdAt.toLocaleDateString(),
      isPublic: c.settings?.isPublic || false
    };
  });
}

// -------------------------------------------------------------
// Contest Management
// -------------------------------------------------------------

export async function getContestForManagement(contestId: string) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) throw new Error("Unauthorized");

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: {
      settings: true,
      members: {
        where: { userId: session.session.user.id }
      },
      problems: {
        include: {
          problem: {
            select: { id: true, title: true, difficulty: true }
          }
        },
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!contest) throw new Error("Contest not found");

  // Check RBAC
  const isOwnerOrMod = contest.members.some(m => m.role === "OWNER" || m.role === "MODERATOR");
  if (!session.isSuperAdmin && !session.permissions.includes("RBAC_CONTESTS") && !isOwnerOrMod) {
    throw new Error("Forbidden: You do not have permission to manage this contest.");
  }

  return contest;
}

export async function searchProblemsForContest(query: string) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) return [];

  // Admins can see all problems. Regular users see public + their own.
  const isAdmin = session.isSuperAdmin || session.permissions.includes("RBAC_PROBLEMS");

  const problems = await prisma.problem.findMany({
    where: {
      isDeleted: false,
      title: { contains: query, mode: "insensitive" },
      ...(isAdmin ? {} : {
        OR: [
          { isPublic: true },
          { createdById: session.session.user.id }
        ]
      })
    },
    select: {
      id: true,
      title: true,
      difficulty: true,
      isPublic: true,
      createdById: true
    },
    take: 20
  });

  return problems.map(p => ({
    ...p,
    isOwner: p.createdById === session.session?.user.id
  }));
}

export async function addProblemToContest(contestId: string, problemId: string, points: number) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) throw new Error("Unauthorized");

  // Basic check to ensure they can manage it
  const membership = await prisma.contestMember.findUnique({
    where: { contestId_userId: { contestId, userId: session.session.user.id } }
  });
  const isAdmin = session.isSuperAdmin || session.permissions.includes("RBAC_CONTESTS");
  if (!isAdmin && (!membership || (membership.role !== "OWNER" && membership.role !== "MODERATOR"))) {
    throw new Error("Forbidden");
  }

  // Get current max order
  const maxOrder = await prisma.contestProblem.aggregate({
    where: { contestId },
    _max: { order: true }
  });

  const nextOrder = (maxOrder._max.order ?? -1) + 1;

  try {
    await prisma.contestProblem.create({
      data: {
        contestId,
        problemId,
        points,
        order: nextOrder
      }
    });
    revalidatePath(`/contests/${contestId}/manage`);
    return { success: true };
  } catch (err: any) {
    if (err.code === "P2002") {
      return { success: false, error: "Problem is already in this contest" };
    }
    return { success: false, error: "Failed to add problem" };
  }
}

export async function removeProblemFromContest(contestId: string, problemId: string) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) throw new Error("Unauthorized");

  const membership = await prisma.contestMember.findUnique({
    where: { contestId_userId: { contestId, userId: session.session.user.id } }
  });
  const isAdmin = session.isSuperAdmin || session.permissions.includes("RBAC_CONTESTS");
  if (!isAdmin && (!membership || (membership.role !== "OWNER" && membership.role !== "MODERATOR"))) {
    throw new Error("Forbidden");
  }

  try {
    await prisma.contestProblem.delete({
      where: {
        contestId_problemId: { contestId, problemId }
      }
    });

    revalidatePath(`/contests/${contestId}/manage`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: "Failed to remove problem" };
  }
}


