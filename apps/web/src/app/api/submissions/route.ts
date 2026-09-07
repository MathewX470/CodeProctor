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
