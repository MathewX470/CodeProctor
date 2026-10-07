"use server";

import { prisma } from "@/lib/prisma";
import { getSessionWithRoles } from "./auth";
import { revalidatePath } from "next/cache";
import { ProctoringMode } from "@prisma/client";
import { uploadProctorSnapshot, getPresignedSnapshotUrl } from "@/lib/proctoring/s3Snapshots";

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
      const isFullScreen = data.proctoringMode === "FULL_SCREEN";
      const isCv = data.proctoringMode === "CV_PROCTORED";

      await tx.contestSettings.create({
        data: {
          contestId: newContest.id,
          proctoringMode: data.proctoringMode,
          isPublic: data.isPublic,
          requireFullScreen: isFullScreen || isCv,
          detectTabSwitch: isFullScreen || isCv,
          detectCopyPaste: isFullScreen || isCv,
          requireCamera: isCv,
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
    where: { isDeleted: false },
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
            select: { id: true, title: true, difficulty: true, slug: true, createdById: true, isPublic: true }
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
              _count: {
                select: { testCases: true }
              },
              submissions: {
                where: { userId, contestId },
                select: { 
                  id: true, 
                  verdict: true,
                  testCaseResults: {
                    select: { verdict: true }
                  }
                }
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

  // Calculate problem statuses and partial points for current user
  const problemsWithStatus = contest.problems.map(cp => {
    const subs = cp.problem.submissions || [];
    const totalCases = cp.problem._count?.testCases || 1;
    
    let maxPassed = 0;
    for (const sub of subs) {
      if (sub.verdict === "ACCEPTED") {
        maxPassed = totalCases;
        break;
      }
      const passed = sub.testCaseResults?.filter(tc => tc.verdict === "ACCEPTED").length || 0;
      if (passed > maxPassed) maxPassed = passed;
    }

    const earnedPoints = totalCases > 0 ? Math.round((maxPassed / totalCases) * cp.points) : 0;
    const isAccepted = earnedPoints === cp.points && cp.points > 0;
    const isPartial = earnedPoints > 0 && !isAccepted;
    const hasAttempted = subs.length > 0;
    
    const status: "ACCEPTED" | "PARTIAL" | "ATTEMPTED" | "NOT_ATTEMPTED" = isAccepted 
      ? "ACCEPTED" 
      : isPartial
      ? "PARTIAL"
      : (hasAttempted ? "ATTEMPTED" : "NOT_ATTEMPTED");

    return {
      ...cp,
      userStatus: status,
      earnedPoints,
      passedCases: maxPassed,
      totalCases
    };
  });

  const proctorSession = await prisma.proctorSession.findUnique({
    where: { participantId: member.id },
    include: { _count: { select: { violations: true } } }
  });
  const violationCount = proctorSession?._count.violations || 0;

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
    member: {
      ...member,
      violationCount
    }
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
    if (member.isDisqualified) {
      throw new Error("You have been disqualified from this contest.");
    }

    if (!member.startedAt) {
      await prisma.contestMember.update({
        where: { contestId_userId: { contestId, userId } },
        data: { startedAt: new Date() }
      });
    }

    // Ensure ProctorSession is initialized
    const existingSession = await prisma.proctorSession.findUnique({
      where: { participantId: member.id }
    });
    if (!existingSession) {
      await prisma.proctorSession.create({
        data: {
          participantId: member.id,
          startedAt: new Date()
        }
      });
    }

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
    include: { contest: { include: { settings: true } } }
  });

  if (!member || !member.startedAt) {
    throw new Error("Contest not started or unauthorized");
  }

  if (member.role === "OWNER" || member.role === "MODERATOR") {
    throw new Error("Contest creators and moderators cannot enter the participant arena.");
  }

  if (member.isDisqualified) {
    throw new Error(`Disqualified: ${member.disqualifiedReason || "You have been disqualified from this contest."}`);
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
      contestProblems: {
        where: { contestId },
        select: { points: true }
      },
      _count: {
        select: { testCases: true }
      },
      submissions: {
        where: { userId, contestId },
        orderBy: { submittedAt: "desc" },
        include: { 
          language: true,
          testCaseResults: {
            select: { verdict: true }
          }
        }
      }
    }
  });

  if (!problemData) throw new Error("Problem not found");

  const currentProblemPoints = problemData.contestProblems?.[0]?.points || 100;
  const totalProblemCases = problemData._count?.testCases || 1;

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
          _count: {
            select: { testCases: true }
          },
          submissions: {
            where: { userId, contestId },
            select: { 
              verdict: true,
              testCaseResults: {
                select: { verdict: true }
              }
            }
          }
        } 
      } 
    }
  });
  
  const allProblems = allProblemsRaw.map(cp => {
    const subs = cp.problem.submissions || [];
    const tcTotal = cp.problem._count?.testCases || 1;
    let maxPassed = 0;
    for (const sub of subs) {
      if (sub.verdict === "ACCEPTED") {
        maxPassed = tcTotal;
        break;
      }
      const passed = sub.testCaseResults?.filter(tc => tc.verdict === "ACCEPTED").length || 0;
      if (passed > maxPassed) maxPassed = passed;
    }

    const earned = tcTotal > 0 ? Math.round((maxPassed / tcTotal) * cp.points) : 0;
    const isSolved = earned === cp.points && cp.points > 0;
    const isPartial = earned > 0 && !isSolved;
    const isAttempted = subs.length > 0;

    return { 
      id: cp.problem.id, 
      title: cp.problem.title,
      points: cp.points,
      earnedPoints: earned,
      passedCases: maxPassed,
      totalCases: tcTotal,
      status: isSolved ? "ACCEPTED" : (isPartial ? "PARTIAL" : (isAttempted ? "ATTEMPTED" : "NOT_ATTEMPTED"))
    };
  });

  return {
    problem: {
      ...problemData,
      points: currentProblemPoints,
      totalTestCases: totalProblemCases,
      templates: problemData.languageTemplates,
      tags: problemData.problemTags.map(pt => pt.tag.name),
      allLanguages,
      submissions: problemData.submissions.map(s => {
        const passedCases = s.verdict === "ACCEPTED" 
          ? totalProblemCases 
          : (s.testCaseResults?.filter(tc => tc.verdict === "ACCEPTED").length || 0);
        const earned = totalProblemCases > 0 ? Math.round((passedCases / totalProblemCases) * currentProblemPoints) : 0;

        return {
          id: s.id,
          status: s.status,
          verdict: s.verdict,
          executionTime: s.executionTime,
          memoryUsed: s.memoryUsed,
          sourceCode: s.sourceCode,
          languageId: s.languageId,
          languageName: s.language.name,
          createdAt: s.submittedAt,
          passedTestCases: passedCases,
          totalTestCases: totalProblemCases,
          earnedPoints: earned
        };
      })
    },
    userId,
    allProblems,
    userEndTime: userEndTime.toISOString(),
    settings: member.contest.settings,
    violationCount: (await prisma.proctorSession.findUnique({
      where: { participantId: member.id },
      include: { _count: { select: { violations: true } } }
    }))?._count.violations || 0,
    isDisqualified: member.isDisqualified,
    disqualifiedReason: member.disqualifiedReason
  };
}

export async function getContestResultsServer(contestId: string) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) throw new Error("Unauthorized");
  const userId = session.session.user.id;

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: {
      settings: true,
      problems: {
        orderBy: { order: "asc" },
        include: {
          problem: {
            select: { 
              id: true, 
              title: true, 
              difficulty: true,
              _count: {
                select: { testCases: true }
              }
            }
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
  const isAdmin = session.isSuperAdmin || session.permissions.includes("RBAC_CONTESTS");
  if (!member && !isAdmin && !contest.settings?.isPublic) {
    throw new Error("Not a member of this contest");
  }

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
      },
      testCaseResults: {
        select: { verdict: true }
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
      const totalCases = cp.problem._count?.testCases || 1;
      
      let maxPointsEarned = 0;
      let maxPassedCases = 0;
      let bestSubmission: any = null;
      let wrongAttempts = 0;
      let firstFullSolve: any = null;

      for (const sub of pSubs) {
        const passedCases = sub.verdict === "ACCEPTED" 
          ? totalCases 
          : (sub.testCaseResults?.filter(tc => tc.verdict === "ACCEPTED").length || 0);
        
        const subPoints = totalCases > 0 ? Math.round((passedCases / totalCases) * cp.points) : 0;

        if (subPoints > maxPointsEarned) {
          maxPointsEarned = subPoints;
          maxPassedCases = passedCases;
          bestSubmission = sub;
        }

        if (sub.verdict === "ACCEPTED" && !firstFullSolve) {
          firstFullSolve = sub;
        }

        if (sub.verdict !== "ACCEPTED" && sub.verdict !== "COMPILATION_ERROR") {
          if (!firstFullSolve) {
            wrongAttempts++;
          }
        }
      }

      const solved = maxPointsEarned === cp.points && cp.points > 0;
      const partiallySolved = maxPointsEarned > 0 && !solved;
      let timeMins = 0;

      if (maxPointsEarned > 0) {
        score += maxPointsEarned;
        if (solved) solvedCount++;

        const targetSub = firstFullSolve || bestSubmission;
        if (targetSub) {
          const startTime = m.startedAt ? new Date(m.startedAt) : new Date(contest.startTime);
          timeMins = Math.max(0, Math.floor((new Date(targetSub.submittedAt).getTime() - startTime.getTime()) / 60000));
          penalty += timeMins + (solved ? (wrongAttempts * 20) : 0);
        }
      }

      return {
        problemId: cp.problemId,
        solved,
        partiallySolved,
        points: maxPointsEarned,
        maxPoints: cp.points,
        passedCases: maxPassedCases,
        totalCases,
        timeMins,
        wrongAttempts: solved ? wrongAttempts : pSubs.length
      };
    });

    return { 
      userId: m.userId, 
      name: m.user.name || m.user.email.split("@")[0],
      email: m.user.email,
      image: m.user.image,
      score: m.isDisqualified ? 0 : score, 
      penalty, 
      solvedCount: m.isDisqualified ? 0 : solvedCount,
      problemResults,
      startedAt: m.startedAt,
      completedAt: (m as any).completedAt,
      isDisqualified: m.isDisqualified,
      disqualifiedReason: m.disqualifiedReason
    };
  });

  // Rank members (active higher score first, disqualified members at bottom)
  memberStats.sort((a, b) => {
    if (a.isDisqualified && !b.isDisqualified) return 1;
    if (!a.isDisqualified && b.isDisqualified) return -1;
    if (a.score !== b.score) return b.score - a.score;
    return a.penalty - b.penalty;
  });

  const rankedLeaderboard = memberStats.map((entry, index) => ({
    ...entry,
    rank: entry.isDisqualified ? 0 : index + 1
  }));

  const isOrganizer = member ? (member.role === "OWNER" || member.role === "MODERATOR") : isAdmin;
  const currentUserStats = rankedLeaderboard.find(s => s.userId === userId);
  const rank = currentUserStats?.rank || 0;

  // Build user's specific problem breakdown with partial score details
  const userSubmissions = allSubmissions.filter(s => s.userId === userId);
  const problemBreakdown = contest.problems.map(cp => {
    const subs = userSubmissions.filter(s => s.problemId === cp.problemId);
    const totalCases = cp.problem._count?.testCases || 1;

    const enrichedSubs = subs.map(s => {
      const passedCases = s.verdict === "ACCEPTED" 
        ? totalCases 
        : (s.testCaseResults?.filter(tc => tc.verdict === "ACCEPTED").length || 0);
      const earned = totalCases > 0 ? Math.round((passedCases / totalCases) * cp.points) : 0;
      return {
        ...s,
        passedTestCases: passedCases,
        totalTestCases: totalCases,
        earnedPoints: earned
      };
    });

    const sortedSubs = [...enrichedSubs].sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
    
    let bestSub: any = null;
    let maxPts = -1;
    for (const s of enrichedSubs) {
      if (s.earnedPoints > maxPts) {
        maxPts = s.earnedPoints;
        bestSub = s;
      }
    }

    const earnedPoints = maxPts > -1 ? maxPts : 0;
    const isSolved = earnedPoints === cp.points && cp.points > 0;
    const isPartial = earnedPoints > 0 && !isSolved;

    return {
      id: cp.problem.id,
      title: cp.problem.title,
      difficulty: cp.problem.difficulty,
      points: cp.points,
      earnedPoints,
      totalTestCases: totalCases,
      passedTestCases: bestSub?.passedTestCases || 0,
      status: isSolved ? "ACCEPTED" : (isPartial ? "PARTIAL" : (subs.length > 0 ? "ATTEMPTED" : "NOT_ATTEMPTED")),
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
  if (member?.startedAt) {
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
      isOrganizer,
      isDisqualified: !!currentUserStats?.isDisqualified,
      disqualifiedReason: currentUserStats?.disqualifiedReason || null
    },
    problems: problemBreakdown,
    leaderboard: rankedLeaderboard,
    analytics: {
      totalSubmissions: totalSubmissionsCount,
      problemAnalytics
    }
  };
}

// ============================================================
// PROCTORING & INTEGRITY ACTIONS
// ============================================================

export async function recordContestViolationServer({
  contestId,
  type,
  durationSec,
  confidence,
  snapshotBase64,
  metadata
}: {
  contestId: string;
  type: "TAB_SWITCH" | "FULLSCREEN_EXIT" | "PASTE" | "LOOKING_AWAY" | "NO_FACE" | "MULTIPLE_FACES" | "CAMERA_BLOCKED" | "CAMERA_DISCONNECTED";
  durationSec?: number;
  confidence?: number;
  snapshotBase64?: string;
  metadata?: any;
}) {
  try {
    const session = await getSessionWithRoles();
    if (!session.session?.user) throw new Error("Unauthorized");
    const userId = session.session.user.id;

    const member = await prisma.contestMember.findUnique({
      where: { contestId_userId: { contestId, userId } },
      include: { contest: { include: { settings: true } } }
    });

    if (!member) throw new Error("Participant not found");
    if (member.role !== "PARTICIPANT") throw new Error("Only participants are proctored");

    if (member.isDisqualified) {
      return { 
        success: true, 
        isDisqualified: true, 
        reason: member.disqualifiedReason || "Disqualified for violations" 
      };
    }

    // Retrieve or create ProctorSession
    let proctorSession = await prisma.proctorSession.findUnique({
      where: { participantId: member.id }
    });

    if (!proctorSession) {
      proctorSession = await prisma.proctorSession.create({
        data: {
          participantId: member.id,
          startedAt: member.startedAt || new Date()
        }
      });
    }

    // Map to supported Prisma ViolationType enum
    let prismaType: "TAB_SWITCH" | "FULLSCREEN_EXIT" | "PASTE" | "LOOKING_AWAY" | "NO_FACE" | "MULTIPLE_FACES" = "NO_FACE";
    let subType = "";

    if (type === "CAMERA_BLOCKED") {
      prismaType = "NO_FACE";
      subType = "CAMERA_BLOCKED";
    } else if (type === "CAMERA_DISCONNECTED") {
      prismaType = "NO_FACE";
      subType = "CAMERA_DISCONNECTED";
    } else {
      prismaType = type;
    }

    // Determine severity
    let severity: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM";
    if (type === "MULTIPLE_FACES" || type === "CAMERA_BLOCKED") {
      severity = "HIGH";
    } else if (type === "FULLSCREEN_EXIT" && (durationSec || 0) > 10) {
      severity = "HIGH";
    } else if (type === "TAB_SWITCH" && (durationSec || 0) > 10) {
      severity = "HIGH";
    } else if (type === "NO_FACE" && (durationSec || 0) > 15) {
      severity = "HIGH";
    } else {
      severity = "LOW";
    }

    const enrichedMetadata = {
      ...(metadata || {}),
      subType: subType || undefined,
      durationSec: durationSec ?? 0,
      confidence: confidence ?? 1.0,
      recordedAt: new Date().toISOString()
    };

    const violation = await prisma.violation.create({
      data: {
        proctorSessionId: proctorSession.id,
        type: prismaType,
        severity: severity as any,
        metadata: enrichedMetadata
      }
    });

    // If snapshot is included, upload to S3 / local fallback and link to Snapshot table
    if (snapshotBase64) {
      const uploadRes = await uploadProctorSnapshot({
        contestId,
        proctorSessionId: proctorSession.id,
        violationId: violation.id,
        base64Data: snapshotBase64,
        userId
      });

      if (uploadRes?.fileId) {
        await prisma.snapshot.create({
          data: {
            violationId: violation.id,
            fileId: uploadRes.fileId
          }
        });
      }
    }

    const violationCount = await prisma.violation.count({
      where: { proctorSessionId: proctorSession.id }
    });

    return {
      success: true,
      violationId: violation.id,
      violationCount,
      isDisqualified: member.isDisqualified,
      reason: member.disqualifiedReason
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to record violation" };
  }
}

export async function getContestProctoringDataServer(contestId: string) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) throw new Error("Unauthorized");
  const userId = session.session.user.id;

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: {
      settings: true,
      members: {
        where: { userId },
        select: { role: true }
      }
    }
  });

  if (!contest) throw new Error("Contest not found");

  const isOrganizer = 
    contest.members[0]?.role === "OWNER" || 
    contest.members[0]?.role === "MODERATOR" ||
    session.isSuperAdmin || 
    session.permissions.includes("RBAC_CONTESTS");

  if (!isOrganizer) throw new Error("Forbidden: Only contest managers can view proctoring data.");

  // Fetch all participant members with their proctor session and violations
  const participantMembers = await prisma.contestMember.findMany({
    where: { contestId, role: "PARTICIPANT" },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true }
      },
      proctorSession: {
        include: {
          violations: {
            include: {
              snapshots: {
                include: {
                  file: true
                }
              }
            },
            orderBy: { timestamp: "desc" }
          }
        }
      }
    },
    orderBy: { joinedAt: "asc" }
  });

  const participants = await Promise.all(participantMembers.map(async m => {
    const violations = m.proctorSession?.violations || [];
    const tabSwitches = violations.filter(v => v.type === "TAB_SWITCH").length;
    const fullscreenExits = violations.filter(v => v.type === "FULLSCREEN_EXIT").length;
    const pastes = violations.filter(v => v.type === "PASTE").length;
    const multipleFaces = violations.filter(v => v.type === "MULTIPLE_FACES").length;
    const noFace = violations.filter(v => v.type === "NO_FACE" && (v.metadata as any)?.subType !== "CAMERA_BLOCKED").length;
    const cameraBlocked = violations.filter(v => (v.metadata as any)?.subType === "CAMERA_BLOCKED").length;
    const lookingAway = violations.filter(v => v.type === "LOOKING_AWAY").length;
    const others = violations.length - (tabSwitches + fullscreenExits + pastes + multipleFaces + noFace + cameraBlocked + lookingAway);

    const formattedViolations = await Promise.all(violations.map(async v => {
      let snapshotUrl: string | undefined = undefined;
      const snapshotFile = v.snapshots[0]?.file;
      if (snapshotFile) {
        snapshotUrl = await getPresignedSnapshotUrl(snapshotFile, 900);
      }

      const meta = (v.metadata || {}) as any;

      return {
        id: v.id,
        type: v.type,
        subType: meta.subType || undefined,
        severity: v.severity,
        timestamp: v.timestamp.toISOString(),
        durationSec: meta.durationSec ?? 0,
        confidence: meta.confidence ?? 1.0,
        snapshotUrl,
        metadata: meta
      };
    }));

    return {
      id: m.id,
      userId: m.userId,
      name: m.user.name || m.user.email.split("@")[0],
      email: m.user.email,
      image: m.user.image,
      joinedAt: m.joinedAt,
      startedAt: m.startedAt,
      completedAt: m.completedAt,
      isDisqualified: m.isDisqualified,
      disqualifiedReason: m.disqualifiedReason,
      disqualifiedAt: m.disqualifiedAt,
      totalViolations: violations.length,
      tabSwitches,
      fullscreenExits,
      pastes,
      multipleFaces,
      noFace,
      cameraBlocked,
      lookingAway,
      others,
      violations: formattedViolations
    };
  }));

  const totalViolationsCount = participants.reduce((acc, p) => acc + p.totalViolations, 0);
  const disqualifiedCount = participants.filter(p => p.isDisqualified).length;
  const atRiskCount = participants.filter(p => !p.isDisqualified && p.totalViolations > 0).length;
  const cleanCount = participants.filter(p => p.totalViolations === 0).length;

  return {
    contestId: contest.id,
    title: contest.title,
    settings: contest.settings,
    summary: {
      totalParticipants: participants.length,
      totalViolations: totalViolationsCount,
      cleanCount,
      atRiskCount,
      disqualifiedCount
    },
    participants
  };
}

export async function manualDisqualifyMemberServer(contestId: string, targetUserId: string, reason: string) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) throw new Error("Unauthorized");
  const userId = session.session.user.id;

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: { members: { where: { userId } } }
  });

  if (!contest) throw new Error("Contest not found");
  const isOrganizer = contest.members[0]?.role === "OWNER" || contest.members[0]?.role === "MODERATOR" || session.isSuperAdmin;
  if (!isOrganizer) throw new Error("Forbidden");

  await prisma.contestMember.update({
    where: { contestId_userId: { contestId, userId: targetUserId } },
    data: {
      isDisqualified: true,
      disqualifiedReason: reason || "Disqualified manually by contest organizer",
      disqualifiedAt: new Date(),
      completedAt: new Date()
    }
  });

  revalidatePath(`/contests/${contestId}/manage`);
  return { success: true };
}

export async function pardonMemberServer(contestId: string, targetUserId: string) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) throw new Error("Unauthorized");
  const userId = session.session.user.id;

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: { members: { where: { userId } } }
  });

  if (!contest) throw new Error("Contest not found");
  const isOrganizer = contest.members[0]?.role === "OWNER" || contest.members[0]?.role === "MODERATOR" || session.isSuperAdmin;
  if (!isOrganizer) throw new Error("Forbidden");

  const member = await prisma.contestMember.findUnique({
    where: { contestId_userId: { contestId, userId: targetUserId } },
    include: { proctorSession: true }
  });

  if (member) {
    if (member.proctorSession) {
      await prisma.violation.deleteMany({
        where: { proctorSessionId: member.proctorSession.id }
      });
    }

    await prisma.contestMember.update({
      where: { id: member.id },
      data: {
        isDisqualified: false,
        disqualifiedReason: null,
        disqualifiedAt: null
      }
    });
  }

  revalidatePath(`/contests/${contestId}/manage`);
  return { success: true };
}

export async function cloneProblemForContestAction(contestId: string, problemId: string) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) return { success: false, error: "Unauthorized" };

  const userId = session.session.user.id;

  // 1. Check permissions
  const member = await prisma.contestMember.findUnique({
    where: { contestId_userId: { contestId, userId } }
  });

  if (!member || (member.role !== "OWNER" && member.role !== "MODERATOR")) {
    const isAdmin = session.isSuperAdmin || session.permissions.includes("RBAC_CONTESTS");
    if (!isAdmin) {
      return { success: false, error: "You don't have permission to modify this contest" };
    }
  }

  try {
    const newProblemId = await prisma.$transaction(async (tx) => {
      // 2. Fetch original problem
      const original = await tx.problem.findUnique({
        where: { id: problemId },
        include: {
          testCases: true,
          samples: true,
          languageTemplates: true,
        }
      });

      if (!original) throw new Error("Original problem not found");

      // 3. Create clone
      const cloneSlug = `${original.slug}-clone-${Math.random().toString(36).substring(2, 8)}`;
      const cloned = await tx.problem.create({
        data: {
          title: `${original.title} (Clone)`,
          slug: cloneSlug,
          description: original.description,
          difficulty: original.difficulty,
          timeLimit: original.timeLimit,
          memoryLimit: original.memoryLimit,
          isPublic: false, // Ensure it doesn't pollute the public bank
          createdById: userId,
        }
      });

      // 4. Clone Test Cases
      if (original.testCases.length > 0) {
        await tx.testCase.createMany({
          data: original.testCases.map(tc => ({
            problemId: cloned.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: tc.isHidden,
            weight: tc.weight,
          }))
        });
      }

      // 5. Clone Samples
      if (original.samples.length > 0) {
        await tx.problemSample.createMany({
          data: original.samples.map(s => ({
            problemId: cloned.id,
            input: s.input,
            expectedOutput: s.expectedOutput,
            explanation: s.explanation,
            order: s.order,
          }))
        });
      }

      // 6. Clone Templates
      if (original.languageTemplates.length > 0) {
        await tx.languageTemplate.createMany({
          data: original.languageTemplates.map(lt => ({
            problemId: cloned.id,
            languageId: lt.languageId,
            boilerplate: lt.boilerplate,
          }))
        });
      }

      // 7. Swap the ID in the contest
      await tx.contestProblem.update({
        where: { contestId_problemId: { contestId, problemId } },
        data: { problemId: cloned.id }
      });

      return cloned.id;
    });

    revalidatePath(`/contests/${contestId}/manage`);
    return { success: true, newProblemId };
  } catch (error: any) {
    console.error("Clone problem error:", error);
    return { success: false, error: error.message || "Failed to clone problem" };
  }
}

export async function updateProblemPointsInContest(contestId: string, problemId: string, points: number) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) return { success: false, error: "Unauthorized" };

  const userId = session.session.user.id;

  const member = await prisma.contestMember.findUnique({
    where: { contestId_userId: { contestId, userId } }
  });

  if (!member || (member.role !== "OWNER" && member.role !== "MODERATOR")) {
    const isAdmin = session.isSuperAdmin || session.permissions.includes("RBAC_CONTESTS");
    if (!isAdmin) {
      return { success: false, error: "You don't have permission to modify this contest" };
    }
  }

  try {
    await prisma.contestProblem.update({
      where: { contestId_problemId: { contestId, problemId } },
      data: { points }
    });

    revalidatePath(`/contests/${contestId}/manage`);
    return { success: true };
  } catch (error: any) {
    console.error("Update points error:", error);
    return { success: false, error: error.message || "Failed to update points" };
  }
}

export async function archiveContestServer(contestId: string) {
  const session = await getSessionWithRoles();
  if (!session.isSuperAdmin && !session.permissions.includes("RBAC_CONTESTS")) {
    return { error: "Forbidden" };
  }
  await prisma.contest.update({
    where: { id: contestId },
    data: { endTime: new Date() }
  });
  revalidatePath("/admin/contests");
  revalidatePath("/contests");
  return { success: true };
}

export async function deleteContestServer(contestId: string) {
  const session = await getSessionWithRoles();
  if (!session.isSuperAdmin && !session.permissions.includes("RBAC_CONTESTS")) {
    return { error: "Forbidden" };
  }
  await prisma.contest.update({
    where: { id: contestId },
    data: { isDeleted: true }
  });
  revalidatePath("/admin/contests");
  revalidatePath("/contests");
  return { success: true };
}
