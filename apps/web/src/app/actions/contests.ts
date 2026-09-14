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

export async function getPublicContestsServer() {
  const session = await getSessionWithRoles();
  const userId = session.session?.user?.id;

  const publicContests = await prisma.contest.findMany({
    where: {
      settings: { isPublic: true },
      isDeleted: false,
      ...(userId ? {
        members: { none: { userId } }
      } : {})
    },
    include: {
      settings: true,
      _count: {
        select: { members: { where: { role: "PARTICIPANT" } } }
      }
    },
    orderBy: { startTime: 'desc' }
  });

  return publicContests;
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
      },
      _count: {
        select: {
          members: { where: { role: 'PARTICIPANT' } },
          submissions: true
        }
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

export async function joinPublicContest(contestId: string) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) throw new Error("Unauthorized");

  try {
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      include: { settings: true }
    });

    if (!contest || !contest.settings?.isPublic) {
      return { success: false, error: "Contest not found or is not public." };
    }

    const existingMember = await prisma.contestMember.findUnique({
      where: { contestId_userId: { contestId, userId: session.session.user.id } }
    });
    if (existingMember) {
      return { success: false, error: "You are already a member." };
    }

    await prisma.contestMember.create({
      data: {
        contestId,
        userId: session.session.user.id,
        role: "PARTICIPANT"
      }
    });

    revalidatePath("/contests");
    return { success: true, contestId };
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

export async function getArenaDataServer(contestId: string) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) throw new Error("Unauthorized");

  const userId = session.session.user.id;

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: {
      settings: true,
      problems: {
        include: {
          problem: {
            select: {
              id: true,
              title: true,
              slug: true,
              difficulty: true,
              timeLimit: true,
              memoryLimit: true,
              submissions: {
                where: { userId, contestId },
                select: { id: true, verdict: true }
              }
            }
          }
        },
        orderBy: { order: "asc" }
      },
      members: {
        where: { userId }
      }
    }
  });

  if (!contest) {
    throw new Error("Contest not found");
  }

  const member = contest.members[0];
  if (!member) {
    throw new Error("You are not a member of this contest");
  }

  // Calculate problem statuses for current user
  const problemsWithStatus = contest.problems.map(cp => {
    const subs = cp.problem.submissions || [];
    const isAccepted = subs.some(s => s.verdict === "ACCEPTED");
    const hasAttempted = subs.length > 0;
    const status: "ACCEPTED" | "ATTEMPTED" | "NOT_ATTEMPTED" = isAccepted 
      ? "ACCEPTED" 
      : (hasAttempted ? "ATTEMPTED" : "NOT_ATTEMPTED");

    return {
      ...cp,
      userStatus: status
    };
  });

  return {
    contest: {
      id: contest.id,
      title: contest.title,
      description: contest.description,
      startTime: contest.startTime,
      endTime: contest.endTime,
      duration: contest.duration,
      settings: contest.settings,
    },
    problems: problemsWithStatus,
    member: member
  };
}

export async function startContestTimer(contestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSessionWithRoles();
    if (!session.session?.user) throw new Error("Unauthorized");

    const userId = session.session.user.id;

    const member = await prisma.contestMember.findUnique({
      where: { contestId_userId: { contestId, userId } }
    });

    if (!member) throw new Error("Not a member");
    if (member.role === "OWNER" || member.role === "MODERATOR") {
      throw new Error("Contest creators and moderators cannot participate in the contest.");
    }
    if (member.startedAt) return { success: true }; // Already started

    await prisma.contestMember.update({
      where: { contestId_userId: { contestId, userId } },
      data: { startedAt: new Date() }
    });

    revalidatePath(`/contests/${contestId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to start timer" };
  }
}

export async function endContestServer(contestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSessionWithRoles();
    if (!session.session?.user) throw new Error("Unauthorized");

    const userId = session.session.user.id;

    const member = await prisma.contestMember.findUnique({
      where: { contestId_userId: { contestId, userId } }
    });

    if (!member) throw new Error("Not a member");
    if ((member as any).completedAt) return { success: true }; // Already completed

    await (prisma.contestMember as any).update({
      where: { contestId_userId: { contestId, userId } },
      data: { completedAt: new Date() }
    });

    revalidatePath(`/contests/${contestId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to end contest" };
  }
}

export async function getProblemForArenaServer(contestId: string, problemId: string) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) throw new Error("Unauthorized");
  const userId = session.session.user.id;

  const member = await prisma.contestMember.findUnique({
    where: { contestId_userId: { contestId, userId } },
    include: { contest: true }
  });

  if (!member || !member.startedAt) {
    throw new Error("Contest not started or unauthorized");
  }

  if (member.role === "OWNER" || member.role === "MODERATOR") {
    throw new Error("Contest creators and moderators cannot enter the participant arena.");
  }

  // Calculate time remaining and verify not expired
  const now = new Date();
  const startedAt = new Date(member.startedAt);
  const timeBasedOnDuration = new Date(startedAt.getTime() + member.contest.duration * 60000);
  const globalEndTime = new Date(member.contest.endTime);
  const userEndTime = timeBasedOnDuration < globalEndTime ? timeBasedOnDuration : globalEndTime;

  if ((member as any).completedAt || now > userEndTime) {
    throw new Error("Contest has ended");
  }

  const problemData = await prisma.problem.findUnique({
    where: { id: problemId },
    include: {
      problemTags: { include: { tag: true } },
      samples: { orderBy: { order: "asc" } },
      languageTemplates: true,
      submissions: {
        where: { userId, contestId },
        orderBy: { submittedAt: "desc" },
        include: { language: true }
      }
    }
  });

  if (!problemData) throw new Error("Problem not found");

  const allLanguages = await prisma.language.findMany({
    where: { isActive: true }
  });

  const allProblemsRaw = await prisma.contestProblem.findMany({
    where: { contestId },
    orderBy: { order: "asc" },
    include: { 
      problem: { 
        select: { 
          id: true, 
          title: true,
          submissions: {
            where: { userId, contestId },
            select: { verdict: true }
          }
        } 
      } 
    }
  });
  
  const allProblems = allProblemsRaw.map(cp => {
    const isSolved = cp.problem.submissions.some(s => s.verdict === "ACCEPTED");
    const isAttempted = cp.problem.submissions.length > 0;
    return { 
      id: cp.problem.id, 
      title: cp.problem.title,
      points: cp.points,
      status: isSolved ? "ACCEPTED" : isAttempted ? "ATTEMPTED" : "NOT_ATTEMPTED"
    };
  });

  return {
    problem: {
      ...problemData,
      templates: problemData.languageTemplates,
      tags: problemData.problemTags.map(pt => pt.tag.name),
      allLanguages,
      submissions: problemData.submissions.map(s => ({
        id: s.id,
        status: s.status,
        verdict: s.verdict,
        executionTime: s.executionTime,
        memoryUsed: s.memoryUsed,
        sourceCode: s.sourceCode,
        languageName: s.language.name,
        createdAt: s.submittedAt
      }))
    },
    allProblems,
    userEndTime: userEndTime.toISOString()
  };
}

export async function getContestResultsServer(contestId: string) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) throw new Error("Unauthorized");
  const userId = session.session.user.id;

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: {
      problems: {
        orderBy: { order: "asc" },
        include: {
          problem: {
            select: { id: true, title: true, difficulty: true }
          }
        }
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true }
          }
        }
      }
    }
  });

  if (!contest) throw new Error("Contest not found");

  const member = contest.members.find(m => m.userId === userId);
  if (!member) throw new Error("Not a member");

  const allSubmissions = await prisma.submission.findMany({
    where: { contestId },
    orderBy: { submittedAt: 'asc' },
    select: {
      id: true,
      userId: true,
      problemId: true,
      verdict: true,
      executionTime: true,
      memoryUsed: true,
      sourceCode: true,
      submittedAt: true,
      status: true,
      language: {
        select: { name: true, slug: true }
      }
    }
  });

  // Calculate scores and problem matrices for PARTICIPANT members only
  const participantMembers = contest.members.filter(m => m.role === "PARTICIPANT");
  const memberStats = participantMembers.map(m => {
    let score = 0;
    let penalty = 0;
    let solvedCount = 0;
    const mSubs = allSubmissions.filter(s => s.userId === m.userId);

    const problemResults = contest.problems.map(cp => {
      const pSubs = mSubs.filter(s => s.problemId === cp.problemId);
      
      let wrongAttempts = 0;
      let firstAccepted: any = null;

      for (const sub of pSubs) {
        if (sub.verdict === "ACCEPTED") {
          firstAccepted = sub;
          break;
        }
        if (sub.verdict && sub.verdict !== "COMPILATION_ERROR") {
          wrongAttempts++;
        }
      }

      let solved = false;
      let timeMins = 0;
      let points = 0;

      if (firstAccepted) {
        solved = true;
        points = cp.points;
        score += cp.points;
        solvedCount++;
        const startTime = m.startedAt ? new Date(m.startedAt) : new Date(contest.startTime);
        timeMins = Math.max(0, Math.floor((new Date(firstAccepted.submittedAt).getTime() - startTime.getTime()) / 60000));
        penalty += timeMins + (wrongAttempts * 20);
      }

      return {
        problemId: cp.problemId,
        solved,
        points,
        timeMins,
        wrongAttempts: firstAccepted ? wrongAttempts : pSubs.length
      };
    });

    return { 
      userId: m.userId, 
      name: m.user.name || m.user.email.split("@")[0],
      email: m.user.email,
      image: m.user.image,
      score, 
      penalty, 
      solvedCount,
      problemResults,
      startedAt: m.startedAt,
      completedAt: (m as any).completedAt
    };
  });

  // Rank members (ICPC rules: higher score first, then lower penalty)
  memberStats.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    return a.penalty - b.penalty;
  });

  const rankedLeaderboard = memberStats.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));

  const isOrganizer = member.role === "OWNER" || member.role === "MODERATOR";
  const currentUserStats = rankedLeaderboard.find(s => s.userId === userId);
  const rank = currentUserStats?.rank || 0;

  // Build user's specific problem breakdown
  const userSubmissions = allSubmissions.filter(s => s.userId === userId);
  const problemBreakdown = contest.problems.map(cp => {
    const subs = userSubmissions.filter(s => s.problemId === cp.problemId);
    // Sort submissions descending for history view
    const sortedSubs = [...subs].sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
    
    const accepted = subs.find(s => s.verdict === "ACCEPTED");
    let bestSub = null;
    if (accepted) {
      bestSub = accepted;
    } else if (subs.length > 0) {
      bestSub = sortedSubs[0];
    }

    return {
      id: cp.problem.id,
      title: cp.problem.title,
      difficulty: cp.problem.difficulty,
      points: cp.points,
      bestSubmission: bestSub,
      history: sortedSubs
    };
  });

  // Overall Contest Analytics
  const totalSubmissionsCount = allSubmissions.length;
  const userTotalSubmissions = userSubmissions.length;
  const userAcceptedSubmissions = userSubmissions.filter(s => s.verdict === "ACCEPTED").length;
  const userAccuracy = userTotalSubmissions > 0 
    ? Math.round((userAcceptedSubmissions / userTotalSubmissions) * 100) 
    : 0;

  const problemAnalytics = contest.problems.map(cp => {
    const pSubs = allSubmissions.filter(s => s.problemId === cp.problemId);
    const uniqueSolvers = new Set(pSubs.filter(s => s.verdict === "ACCEPTED").map(s => s.userId)).size;
    const totalParticipants = participantMembers.length;
    const solveRate = totalParticipants > 0 ? Math.round((uniqueSolvers / totalParticipants) * 100) : 0;
    return {
      problemId: cp.problemId,
      title: cp.problem.title,
      difficulty: cp.problem.difficulty,
      points: cp.points,
      totalSubmissions: pSubs.length,
      acceptedCount: uniqueSolvers,
      solveRate
    };
  });

  // Time spent
  let totalMinutesSpent = 0;
  if (member.startedAt) {
    const start = new Date(member.startedAt).getTime();
    const end = (member as any).completedAt 
      ? new Date((member as any).completedAt).getTime() 
      : new Date().getTime();
    totalMinutesSpent = Math.max(0, Math.round((end - start) / 60000));
  }

  return {
    contestId: contest.id,
    title: contest.title,
    duration: contest.duration,
    stats: {
      score: currentUserStats?.score || 0,
      totalPossibleScore: contest.problems.reduce((acc, p) => acc + p.points, 0),
      rank: rank,
      totalParticipants: participantMembers.length,
      solved: currentUserStats?.solvedCount || 0,
      total: contest.problems.length,
      penalty: currentUserStats?.penalty || 0,
      accuracy: userAccuracy,
      minutesSpent: totalMinutesSpent,
      isOrganizer
    },
    problems: problemBreakdown,
    leaderboard: rankedLeaderboard,
    analytics: {
      totalSubmissions: totalSubmissionsCount,
      problemAnalytics
    }
  };
}
