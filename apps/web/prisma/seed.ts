import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, Difficulty, ProctoringMode } from "@prisma/client";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL || "",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("[ CODEPROCTOR // DATABASE SEED INITIATED ]");

  // 1. Create System Admin Author
  const systemAuthor = await prisma.user.upsert({
    where: { email: "admin@codeproctor.ai" },
    update: {},
    create: {
      id: "cp-system-author-01",
      email: "admin@codeproctor.ai",
      name: "System Proctor_AI",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log(`[ ✔ ] Author Profile Active: ${systemAuthor.name}`);

  // 2. Initialize Topic Tags
  const tagNames = [
    "Array",
    "Two Pointers",
    "Dynamic Programming",
    "Graphs",
    "Bit Manipulation",
    "Computer Vision",
    "Greedy",
    "Hash Table",
  ];

  const tagMap: Record<string, string> = {};
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    tagMap[name] = tag.id;
  }
  console.log(`[ ✔ ] ${tagNames.length} Topic Tags Synchronized.`);

  // 3. Create Curated Problem Bank
  const problemsData = [
    {
      title: "Zero-Trust Memory Allocator",
      slug: "zero-trust-memory-allocator",
      difficulty: Difficulty.EASY,
      timeLimit: 500,
      memoryLimit: 128,
      tags: ["Array", "Hash Table"],
      description: `### Zero-Trust Memory Allocator
In a zero-trust execution sandbox, memory addresses must be continuously validated. Given an array of integers representing allocated memory registers and an integer \`target\`, return the indices of the two registers that sum up to the target checksum.

#### Input Format
- The first line contains an integer \`N\`, the number of memory registers.
- The second line contains \`N\` space-separated integers representing the registers.
- The third line contains the target checksum.

#### Output Format
- Print two space-separated integers representing the 0-based indices in ascending order.`,
      sampleInput: `4\n2 7 11 15\n9`,
      sampleOutput: `0 1`,
      explanation: "Registers at index 0 (2) and index 1 (7) sum to 9.",
    },
    {
      title: "Suboptimal Gaze Angle Tracking",
      slug: "suboptimal-gaze-angle-tracking",
      difficulty: Difficulty.EASY,
      timeLimit: 1000,
      memoryLimit: 256,
      tags: ["Array", "Two Pointers", "Computer Vision"],
      description: `### Suboptimal Gaze Angle Tracking
Our webcam biometric telemetry stream reports candidate gaze angles as signed degrees relative to the display center. Determine if there exists a continuous time window where the total cumulative gaze angle deviation exceeds the allowed tolerance threshold.

#### Input Format
- An array of floating point gaze deviation readings over \`T\` seconds.

#### Output Format
- Output \`VIOLATION\` if threshold exceeded, otherwise \`NOMINAL\`.`,
      sampleInput: `5\n12.5 -5.0 45.2 30.1 10.0\n50.0`,
      sampleOutput: `VIOLATION`,
      explanation: "Sum of consecutive readings [45.2, 30.1] exceeds threshold 50.0.",
    },
    {
      title: "Biometric Matrix Inversion",
      slug: "biometric-matrix-inversion",
      difficulty: Difficulty.MEDIUM,
      timeLimit: 1500,
      memoryLimit: 256,
      tags: ["Array", "Computer Vision"],
      description: `### Biometric Matrix Inversion
An infrared surveillance snapshot is encoded as an \`N x N\` binary grid. To correct for thermal camera reflection, you must invert the image horizontally and then invert each bit.`,
      sampleInput: `3\n1 1 0\n1 0 1\n0 0 0`,
      sampleOutput: `1 0 0\n0 1 0\n1 1 1`,
    },
    {
      title: "LRU Telemetry Cache",
      slug: "lru-telemetry-cache",
      difficulty: Difficulty.MEDIUM,
      timeLimit: 1000,
      memoryLimit: 128,
      tags: ["Hash Table", "Dynamic Programming"],
      description: `### LRU Telemetry Cache
Design a specialized memory cache for candidate behavior event logs with Least Recently Used (LRU) eviction heuristics. Support \`PUT(key, val)\` and \`GET(key)\` in O(1) time complexity.`,
      sampleInput: `2\nPUT 1 10\nPUT 2 20\nGET 1\nPUT 3 30\nGET 2`,
      sampleOutput: `10\n-1`,
    },
    {
      title: "Graph Cycle Deadlock Monitor",
      slug: "graph-cycle-deadlock-monitor",
      difficulty: Difficulty.MEDIUM,
      timeLimit: 2000,
      memoryLimit: 512,
      tags: ["Graphs"],
      description: `### Graph Cycle Deadlock Monitor
A multi-threaded submission testing container utilizes mutual exclusion locks across runtime threads. Given a directed graph of lock acquisition requests, detect if an irreducible deadlock cycle exists.`,
      sampleInput: `3 3\n0 1\n1 2\n2 0`,
      sampleOutput: `DEADLOCK DETECTED`,
    },
    {
      title: "Optimal Tab-Lock Security Protocol",
      slug: "optimal-tab-lock-security-protocol",
      difficulty: Difficulty.HARD,
      timeLimit: 1000,
      memoryLimit: 128,
      tags: ["Greedy", "Dynamic Programming"],
      description: `### Optimal Tab-Lock Security Protocol
Given a stream of browser focus loss duration timestamps, calculate the optimal partitioning of warning webhooks such that overall exam latency is minimized while capturing 100% of illegal tab-switch evasions.`,
      sampleInput: `5\n100 250 80 400 90\n3`,
      sampleOutput: `250`,
    },
    {
      title: "Distributed Proctor Consensus",
      slug: "distributed-proctor-consensus",
      difficulty: Difficulty.HARD,
      timeLimit: 2500,
      memoryLimit: 512,
      tags: ["Graphs", "Bit Manipulation"],
      description: `### Distributed Proctor Consensus
In a decentralized grading mesh, multiple judge worker containers must agree on a candidate's final verdict using a bit-wise Byzantine fault-tolerant algorithm.`,
      sampleInput: `4\n1 1 0 1`,
      sampleOutput: `CONSENSUS: ACCEPTED`,
    },
    {
      title: "Valid Anagram Verification",
      slug: "valid-anagram-verification",
      difficulty: Difficulty.EASY,
      timeLimit: 500,
      memoryLimit: 64,
      tags: ["Hash Table", "Array"],
      description: `### Valid Anagram Verification
To prevent simple code plagiarism via variable renaming, verify if token string \`S\` is an anagram of reference token \`T\`.`,
      sampleInput: `anagram\nnagaram`,
      sampleOutput: `true`,
    },
  ];

  const problemIds: string[] = [];
  for (const item of problemsData) {
    const p = await prisma.problem.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        difficulty: item.difficulty,
        timeLimit: item.timeLimit,
        memoryLimit: item.memoryLimit,
        description: item.description,
        isPublic: true,
      },
      create: {
        title: item.title,
        slug: item.slug,
        difficulty: item.difficulty,
        timeLimit: item.timeLimit,
        memoryLimit: item.memoryLimit,
        description: item.description,
        isPublic: true,
        createdById: systemAuthor.id,
      },
    });

    problemIds.push(p.id);

    // Link topic tags
    for (const tagName of item.tags) {
      const tagId = tagMap[tagName];
      if (tagId) {
        await prisma.problemTag.upsert({
          where: { problemId_tagId: { problemId: p.id, tagId } },
          update: {},
          create: { problemId: p.id, tagId },
        });
      }
    }

    // Add sample I/O
    if (item.sampleInput) {
      const existingSample = await prisma.problemSample.findFirst({
        where: { problemId: p.id },
      });
      if (!existingSample) {
        await prisma.problemSample.create({
          data: {
            problemId: p.id,
            input: item.sampleInput,
            expectedOutput: item.sampleOutput || "",
            explanation: (item as unknown as { explanation?: string }).explanation || null,
            order: 0,
          },
        });
      }
    }
  }
  console.log(`[ ✔ ] 8 Algorithmic Assessment Problems Synchronized.`);

  // 4. Initialize Timed Contests
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowEnd = new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000);

  // Active Contest
  const contest1 = await prisma.contest.upsert({
    where: { id: "cp-contest-active-01" },
    update: { startTime: oneHourAgo, endTime: threeHoursLater },
    create: {
      id: "cp-contest-active-01",
      title: "CodeProctor Ignition // Global Sprint #01",
      description:
        "High-velocity algorithmic tournament under strict real-time computer vision monitoring and eye gaze tracking.",
      startTime: oneHourAgo,
      endTime: threeHoursLater,
      duration: 240,
      settings: {
        create: {
          proctoringMode: ProctoringMode.CV_PROCTORED,
          requireCamera: true,
          requireFullScreen: true,
          detectTabSwitch: true,
          detectCopyPaste: true,
          isPublic: true,
        },
      },
    },
  });

  // Upcoming Contest
  const contest2 = await prisma.contest.upsert({
    where: { id: "cp-contest-upcoming-02" },
    update: { startTime: tomorrow, endTime: tomorrowEnd },
    create: {
      id: "cp-contest-upcoming-02",
      title: "Zero-Trust Algorithmic Championship #02",
      description:
        "Elite qualification rounds requiring full-screen tab-lock isolation and cryptographic evaluation.",
      startTime: tomorrow,
      endTime: tomorrowEnd,
      duration: 240,
      settings: {
        create: {
          proctoringMode: ProctoringMode.FULL_SCREEN,
          requireCamera: false,
          requireFullScreen: true,
          detectTabSwitch: true,
          detectCopyPaste: false,
          isPublic: true,
        },
      },
    },
  });
  console.log(`[ ✔ ] Upcoming Tournament Synchronized: ${contest2.title}`);

  // Attach sample problems to contests
  if (problemIds.length >= 3) {
    await prisma.contestProblem.upsert({
      where: { contestId_problemId: { contestId: contest1.id, problemId: problemIds[0]! } },
      update: {},
      create: { contestId: contest1.id, problemId: problemIds[0]!, order: 1, points: 100 },
    });
    await prisma.contestProblem.upsert({
      where: { contestId_problemId: { contestId: contest1.id, problemId: problemIds[1]! } },
      update: {},
      create: { contestId: contest1.id, problemId: problemIds[1]!, order: 2, points: 250 },
    });
  }

  console.log(`[ ✔ ] Active & Upcoming Contests Initialized.`);
  console.log("[ STATUS: SEED COMPLETE // ARENA READY ]");
}

main()
  .catch((e) => {
    console.error("[ SEED ERROR ]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
