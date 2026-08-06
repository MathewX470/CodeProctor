import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const url = new URL(req.url);
    const submissionId = url.searchParams.get("submissionId");

    if (!submissionId) {
      return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
    }

    // 1. Fetch problem id
    const problem = await prisma.problem.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!problem) return NextResponse.json({ error: "Problem not found" }, { status: 404 });

    // 1.5 Fetch target submission first to get its language and metrics
    const targetSub = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { id: true, executionTime: true, memoryUsed: true, languageId: true, userId: true }
    });

    if (!targetSub || targetSub.executionTime == null || targetSub.memoryUsed == null) {
      return NextResponse.json({ error: "Target submission not found or missing metrics" }, { status: 400 });
    }

    // 2. Fetch all ACCEPTED submissions for this problem AND this language
    const allAccepted = await prisma.submission.findMany({
      where: {
        problemId: problem.id,
        verdict: "ACCEPTED",
        languageId: targetSub.languageId
      },
      select: {
        id: true,
        userId: true,
        executionTime: true,
        memoryUsed: true,
      }
    });

    if (allAccepted.length === 0) {
       return NextResponse.json({ error: "No accepted submissions found" }, { status: 404 });
    }

    // 3. Group by user, taking their BEST runtime and BEST memory
    // (We consider the minimum runtime and minimum memory as their best)
    const userBestMap = new Map<string, { executionTime: number, memoryUsed: number }>();
    
    for (const sub of allAccepted) {
      if (!sub.userId || sub.executionTime == null || sub.memoryUsed == null) continue;
      
      const existing = userBestMap.get(sub.userId);
      if (!existing) {
        userBestMap.set(sub.userId, { executionTime: sub.executionTime, memoryUsed: sub.memoryUsed });
      } else {
        userBestMap.set(sub.userId, {
          executionTime: Math.min(existing.executionTime, sub.executionTime),
          memoryUsed: Math.min(existing.memoryUsed, sub.memoryUsed)
        });
      }
    }

    // Convert the map back to an array of unique user bests
    const acceptedSubmissions = Array.from(userBestMap.values());
    
    // Add the current user's target submission if it's not already in the map (e.g. if they are anonymous or something)
    // Actually, their best is already in the map if they are logged in.
    // But we are comparing THIS specific submission, so we just use targetSub.executionTime for the percentile calculation.

    // 4. Calculate percentiles (How many submissions are slower / use more memory)
    const totalCount = acceptedSubmissions.length;
    
    // For runtime: we want to know what % of submissions took MORE time (so we "beat" them)
    // Actually, "Beats X%" means X% of submissions took >= time than us.
    const slowerCount = acceptedSubmissions.filter(s => s.executionTime >= targetSub.executionTime!).length;
    const runtimePercentile = Math.max(0.01, (slowerCount / totalCount) * 100).toFixed(2);

    // For memory: what % of submissions used MORE memory than us
    const moreMemoryCount = acceptedSubmissions.filter(s => s.memoryUsed >= targetSub.memoryUsed!).length;
    const memoryPercentile = Math.max(0.01, (moreMemoryCount / totalCount) * 100).toFixed(2);

    // 5. Generate Histograms (Buckets)
    const numBuckets = 40;

    // --- Runtime Histogram ---
    const runtimes = acceptedSubmissions.map(s => s.executionTime).sort((a, b) => a - b);
    const maxRuntime = Math.max(...runtimes, 1);
    const minRuntime = runtimes[0];
    const runtimeBucketSize = Math.max(1, (maxRuntime - minRuntime) / numBuckets);
    
    const runtimeDistribution = Array.from({ length: numBuckets }).map((_, i) => ({
      min: Math.floor(minRuntime + i * runtimeBucketSize),
      max: Math.floor(minRuntime + (i + 1) * runtimeBucketSize),
      count: 0,
      isCurrent: false
    }));

    runtimes.forEach(rt => {
      let bucketIdx = Math.floor((rt - minRuntime) / runtimeBucketSize);
      if (bucketIdx >= numBuckets) bucketIdx = numBuckets - 1;
      runtimeDistribution[bucketIdx].count++;
    });

    let targetRuntimeBucketIdx = Math.floor((targetSub.executionTime! - minRuntime) / runtimeBucketSize);
    if (targetRuntimeBucketIdx >= numBuckets) targetRuntimeBucketIdx = numBuckets - 1;
    if (targetRuntimeBucketIdx < 0) targetRuntimeBucketIdx = 0;
    runtimeDistribution[targetRuntimeBucketIdx].isCurrent = true;

    // --- Memory Histogram ---
    const memories = acceptedSubmissions.map(s => s.memoryUsed).sort((a, b) => a - b);
    const maxMemory = Math.max(...memories, 1);
    const minMemory = memories[0];
    const memoryBucketSize = Math.max(1, (maxMemory - minMemory) / numBuckets);

    const memoryDistribution = Array.from({ length: numBuckets }).map((_, i) => ({
      min: Math.floor(minMemory + i * memoryBucketSize),
      max: Math.floor(minMemory + (i + 1) * memoryBucketSize),
      count: 0,
      isCurrent: false
    }));

    memories.forEach(mem => {
      let bucketIdx = Math.floor((mem - minMemory) / memoryBucketSize);
      if (bucketIdx >= numBuckets) bucketIdx = numBuckets - 1;
      memoryDistribution[bucketIdx].count++;
    });

    let targetMemoryBucketIdx = Math.floor((targetSub.memoryUsed! - minMemory) / memoryBucketSize);
    if (targetMemoryBucketIdx >= numBuckets) targetMemoryBucketIdx = numBuckets - 1;
    if (targetMemoryBucketIdx < 0) targetMemoryBucketIdx = 0;
    memoryDistribution[targetMemoryBucketIdx].isCurrent = true;

    return NextResponse.json({
      runtimePercentile,
      memoryPercentile,
      runtimeDistribution,
      memoryDistribution,
      totalSubmissions: totalCount
    });

  } catch (error) {
    console.error("[Analytics API Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
