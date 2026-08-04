import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Authenticate user (optional based on your privacy needs, 
    // but good practice to ensure users only see their own submissions)
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // 2. Fetch Submission and test case results
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        testCaseResults: {
          include: {
            testCase: {
              select: {
                isHidden: true,
                input: true,
                expectedOutput: true,
              }
            }
          },
          orderBy: {
            testCaseId: 'asc' // or any other order
          }
        }
      }
    });
    
    if (!submission) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    
    // 3. Security: Ensure the user actually owns this submission (unless they are admin)
    if (submission.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // 4. Sanitize payload (hide actual I/O for hidden test cases)
    const sanitizedResults = submission.testCaseResults.map(tcResult => {
      const isHidden = tcResult.testCase.isHidden;
      
      return {
        id: tcResult.id,
        verdict: tcResult.verdict,
        executionTime: tcResult.executionTime,
        memoryUsed: tcResult.memoryUsed,
        // Only show actual I/O if the testcase is public
        input: isHidden ? null : tcResult.testCase.input,
        expectedOutput: isHidden ? null : tcResult.testCase.expectedOutput,
        actualOutput: isHidden ? null : tcResult.actualOutput,
        isHidden
      };
    });
    
    // 5. Return status
    return NextResponse.json({
      id: submission.id,
      status: submission.status,
      verdict: submission.verdict,
      executionTime: submission.executionTime,
      memoryUsed: submission.memoryUsed,
      judgedAt: submission.judgedAt,
      testCases: sanitizedResults
    });
    
  } catch (error) {
    console.error("[Submission GET API Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
