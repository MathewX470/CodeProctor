import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { submissionQueue } from "@/lib/queue";
import { auth } from "@/lib/auth"; // Assuming better-auth setup is exported here
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // 2. Parse body
    const body = await req.json();
    const { problemId, languageId, sourceCode, actionType = "SUBMIT", contestId } = body;
    
    if (!problemId || !languageId || !sourceCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2.5 Contest Validation: If submission is for a contest, verify user state & timer
    if (contestId) {
      const member = await prisma.contestMember.findUnique({
        where: { contestId_userId: { contestId, userId } },
        include: { contest: true }
      });

      if (!member) {
        return NextResponse.json({ error: "You are not registered for this contest." }, { status: 403 });
      }

      if (!member.startedAt) {
        return NextResponse.json({ error: "You must start the contest before submitting code." }, { status: 403 });
      }

      const now = new Date();
      const startedAt = new Date(member.startedAt);
      const timeBasedOnDuration = new Date(startedAt.getTime() + member.contest.duration * 60000);
      const globalEndTime = new Date(member.contest.endTime);
      const userEndTime = timeBasedOnDuration < globalEndTime ? timeBasedOnDuration : globalEndTime;

      if ((member as any).completedAt || now > userEndTime) {
        if (!(member as any).completedAt) {
          await (prisma.contestMember as any).update({
            where: { contestId_userId: { contestId, userId } },
            data: { completedAt: now }
          });
        }
        return NextResponse.json({ error: "Contest time has expired. Submissions are closed." }, { status: 403 });
      }
    }
    
    // 3. Create Submission in DB
    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId,
        languageId,
        contestId,
        sourceCode,
        status: "QUEUED",
      }
    });
    
    // 4. Push to Upstash Redis queue
    await submissionQueue.add("submission", {
      submissionId: submission.id,
      actionType
    });
    
    // 5. Return submission ID to frontend
    return NextResponse.json({ submissionId: submission.id }, { status: 201 });
    
  } catch (error) {
    console.error("[Submission API Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
