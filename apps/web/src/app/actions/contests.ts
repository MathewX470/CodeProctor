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
};

export async function createContestServer(data: CreateContestInput) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) {
    throw new Error("Unauthorized");
  }

  if (data.endTime <= data.startTime) {
    throw new Error("End time must be after start time.");
  }

  // Public contests are now allowed for all users

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
          joinCode: `CP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          isDeleted: false,
        },
      });

      // 2. Create the settings for the contest
      await tx.contestSettings.create({
        data: {
          contestId: newContest.id,
          proctoringMode: data.proctoringMode,
          isPublic: data.isPublic,
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

  const problems = await prisma.problem.findMany({
    where: {
      isDeleted: false,
      title: { contains: query, mode: "insensitive" },
      OR: [
        { isPublic: true },
        { createdById: session.session.user.id }
      ]
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

export async function updateContestSettings(contestId: string, data: any) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) throw new Error("Unauthorized");

  // Check if owner
  const membership = await prisma.contestMember.findUnique({
    where: { contestId_userId: { contestId, userId: session.session.user.id } }
  });
  const isAdmin = session.isSuperAdmin || session.permissions.includes("RBAC_CONTESTS");
  if (!isAdmin && membership?.role !== "OWNER") {
    throw new Error("Forbidden: Only the contest owner can update settings.");
  }

  // Public contests are now allowed for all users

  if (new Date(data.endTime) <= new Date(data.startTime)) {
    throw new Error("End time must be after start time.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.contest.update({
        where: { id: contestId },
        data: {
          title: data.title,
          description: data.description,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          duration: data.duration,
        }
      });

      await tx.contestSettings.upsert({
        where: { contestId },
        create: {
          contestId,
          proctoringMode: data.proctoringMode,
          requireCamera: data.requireCamera,
          requireFullScreen: data.requireFullScreen,
          detectTabSwitch: data.detectTabSwitch,
          detectCopyPaste: data.detectCopyPaste,
          isPublic: data.isPublic,
        },
        update: {
          proctoringMode: data.proctoringMode,
          requireCamera: data.requireCamera,
          requireFullScreen: data.requireFullScreen,
          detectTabSwitch: data.detectTabSwitch,
          detectCopyPaste: data.detectCopyPaste,
          isPublic: data.isPublic,
        }
      });
    });

    revalidatePath(`/contests/${contestId}/manage`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getContestMembers(contestId: string) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) throw new Error("Unauthorized");

  const members = await prisma.contestMember.findMany({
    where: { contestId },
    include: {
      user: {
        select: { name: true, email: true, image: true }
      }
    },
    orderBy: { joinedAt: 'asc' }
  });

  return members.map(m => ({
    id: m.id,
    userId: m.userId,
    name: m.user.name || m.user.email,
    email: m.user.email,
    role: m.role,
    joinedAt: m.joinedAt,
    isDisqualified: m.isDisqualified,
    disqualifiedReason: m.disqualifiedReason,
  }));
}

export async function inviteContestMember(contestId: string, email: string, role: "MODERATOR" | "PARTICIPANT") {
  const session = await getSessionWithRoles();
  if (!session.session?.user) throw new Error("Unauthorized");

  // Check if owner or moderator
  const membership = await prisma.contestMember.findUnique({
    where: { contestId_userId: { contestId, userId: session.session.user.id } }
  });
  const isAdmin = session.isSuperAdmin || session.permissions.includes("RBAC_CONTESTS");
  
  if (!isAdmin) {
    if (role === "MODERATOR" && membership?.role !== "OWNER") {
      throw new Error("Forbidden: Only the contest owner can add moderators.");
    }
    if (role === "PARTICIPANT" && membership?.role !== "OWNER" && membership?.role !== "MODERATOR") {
      throw new Error("Forbidden: Only owners and moderators can invite participants.");
    }
  }

  // Find user by email
  const userToAdd = await prisma.user.findUnique({ where: { email } });
  if (!userToAdd) {
    return { success: false, error: "No user found with that email address." };
  }

  // Check if they are already in the contest
  const existingMember = await prisma.contestMember.findUnique({
    where: { contestId_userId: { contestId, userId: userToAdd.id } }
  });
  if (existingMember) {
    return { success: false, error: "User is already in this contest." };
  }

  try {
    await prisma.contestInvite.upsert({
      where: { contestId_email: { contestId, email } },
      create: {
        contestId,
        email,
        role: role,
        status: "PENDING"
      },
      update: {
        role: role,
        status: "PENDING",
        invitedAt: new Date()
      }
    });

    revalidatePath(`/contests/${contestId}/manage`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getContestInvites(contestId: string) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) throw new Error("Unauthorized");

  const invites = await prisma.contestInvite.findMany({
    where: { contestId, status: "PENDING" },
    orderBy: { invitedAt: 'desc' }
  });
  return invites;
}

export async function cancelInvite(inviteId: string) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) throw new Error("Unauthorized");

  try {
    const invite = await prisma.contestInvite.findUnique({ where: { id: inviteId } });
    if (!invite) throw new Error("Invite not found");

    // Check permissions
    const membership = await prisma.contestMember.findUnique({
      where: { contestId_userId: { contestId: invite.contestId, userId: session.session.user.id } }
    });
    const isAdmin = session.isSuperAdmin || session.permissions.includes("RBAC_CONTESTS");
    
    if (!isAdmin) {
      if (invite.role === "MODERATOR" && membership?.role !== "OWNER") {
        throw new Error("Forbidden");
      }
      if (invite.role === "PARTICIPANT" && membership?.role !== "OWNER" && membership?.role !== "MODERATOR") {
        throw new Error("Forbidden");
      }
    }

    await prisma.contestInvite.delete({ where: { id: inviteId } });
    revalidatePath(`/contests/${invite.contestId}/manage`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getMyInvites() {
  const session = await getSessionWithRoles();
  if (!session.session?.user) throw new Error("Unauthorized");

  const invites = await prisma.contestInvite.findMany({
    where: { email: session.session.user.email, status: "PENDING" },
    include: {
      contest: {
        select: { title: true, startTime: true, endTime: true, duration: true }
      }
    },
    orderBy: { invitedAt: 'desc' }
  });

  return invites;
}

export async function respondToInvite(inviteId: string, accept: boolean) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) throw new Error("Unauthorized");

  try {
    const invite = await prisma.contestInvite.findUnique({ where: { id: inviteId } });
    if (!invite) throw new Error("Invite not found");
    if (invite.email !== session.session.user.email) throw new Error("Unauthorized");
    if (invite.status !== "PENDING") throw new Error("Invite is no longer valid");

    if (!accept) {
      await prisma.contestInvite.update({
        where: { id: inviteId },
        data: { status: "DECLINED", respondedAt: new Date() }
      });
      revalidatePath(`/contests`);
      return { success: true };
    }

    await prisma.$transaction(async (tx) => {
      await tx.contestInvite.update({
        where: { id: inviteId },
        data: { status: "ACCEPTED", respondedAt: new Date() }
      });
      await tx.contestMember.create({
        data: {
          contestId: invite.contestId,
          userId: session.session.user.id,
          role: invite.role
        }
      });
    });

    revalidatePath(`/contests`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function joinContestByCode(joinCode: string) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) throw new Error("Unauthorized");

  try {
    const contest = await prisma.contest.findUnique({
      where: { joinCode: joinCode.trim() },
      include: { settings: true }
    });

    if (!contest) {
      return { success: false, error: "Invalid Join Code. Contest not found." };
    }

    // Check if already a member
    const existingMember = await prisma.contestMember.findUnique({
      where: { contestId_userId: { contestId: contest.id, userId: session.session.user.id } }
    });
    if (existingMember) {
      return { success: false, error: "You are already a member of this contest." };
    }

    // Add user as PARTICIPANT
    await prisma.contestMember.create({
      data: {
        contestId: contest.id,
        userId: session.session.user.id,
        role: "PARTICIPANT"
      }
    });

    revalidatePath("/contests");
    return { success: true, contestId: contest.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function removeMember(contestId: string, memberId: string) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) throw new Error("Unauthorized");

  // Get the target member to see their role
  const targetMember = await prisma.contestMember.findUnique({
    where: { id: memberId }
  });

  if (!targetMember) return { success: false, error: "Member not found" };

  // Check permissions
  const myMembership = await prisma.contestMember.findUnique({
    where: { contestId_userId: { contestId, userId: session.session.user.id } }
  });
  const isAdmin = session.isSuperAdmin || session.permissions.includes("RBAC_CONTESTS");

  if (!isAdmin) {
    if (myMembership?.role === "PARTICIPANT" || !myMembership) {
      throw new Error("Forbidden");
    }
    // Moderators can't remove owners or other moderators
    if (myMembership.role === "MODERATOR" && (targetMember.role === "OWNER" || targetMember.role === "MODERATOR")) {
      throw new Error("Forbidden: Moderators can only remove participants.");
    }
  }

  try {
    await prisma.contestMember.delete({
      where: { id: memberId }
    });
    revalidatePath(`/contests/${contestId}/manage`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
