"use server";

import { prisma } from "@/lib/prisma";
import { getSessionWithRoles } from "./auth";

export async function getAdminAnalyticsServer() {
  const session = await getSessionWithRoles();
  if (!session.isSuperAdmin && !session.permissions.includes("RBAC_ANALYTICS")) {
    throw new Error("Forbidden");
  }

  // 1. Language Popularity (Aggregate submissions by languageId)
  const langGroups = await prisma.submission.groupBy({
    by: ['languageId'],
    _count: { languageId: true }
  });

  // We need to fetch the actual language names because we only have languageId
  const allLangs = await prisma.language.findMany();
  const langMap = Object.fromEntries(allLangs.map(l => [l.id, l.name]));

  const languagePopularity = langGroups.map(g => ({
    name: langMap[g.languageId] || "Unknown",
    value: g._count.languageId
  })).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5

  // 2. Submission Outcomes
  const verdictGroups = await prisma.submission.groupBy({
    by: ['verdict'],
    _count: { verdict: true }
  });

  let acCount = 0;
  let waCount = 0;
  let errCount = 0;
  
  verdictGroups.forEach(g => {
    if (!g.verdict) return;
    if (g.verdict === "ACCEPTED") acCount += g._count.verdict;
    else if (g.verdict === "WRONG_ANSWER") waCount += g._count.verdict;
    else errCount += g._count.verdict;
  });

  const submissionOutcomes = [
    { name: "Accepted", count: acCount },
    { name: "Wrong Answer", count: waCount },
    { name: "Error / Other", count: errCount }
  ];

  // 3. User Growth (Users created in the last 6 months, grouped by month)
  // SQLite/Postgres grouping by date is complex in raw Prisma without rawQuery, 
  // so we will fetch users from last 6 months and group in memory.
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true }
  });

  const userGrowthMap = new Map<string, number>();
  users.forEach(u => {
    const month = u.createdAt.toLocaleString('default', { month: 'short', year: '2-digit' });
    userGrowthMap.set(month, (userGrowthMap.get(month) || 0) + 1);
  });

  // 4. Contest Growth
  const contests = await prisma.contest.findMany({
    where: { createdAt: { gte: sixMonthsAgo }, isDeleted: false },
    select: { createdAt: true }
  });

  const contestGrowthMap = new Map<string, number>();
  contests.forEach(c => {
    const month = c.createdAt.toLocaleString('default', { month: 'short', year: '2-digit' });
    contestGrowthMap.set(month, (contestGrowthMap.get(month) || 0) + 1);
  });

  // Format charts for Recharts
  // We want an array of the last 6 months in order
  const monthLabels = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    monthLabels.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));
  }

  const userGrowth = monthLabels.map(month => ({
    name: month,
    users: userGrowthMap.get(month) || 0
  }));

  const contestGrowth = monthLabels.map(month => ({
    name: month,
    contests: contestGrowthMap.get(month) || 0
  }));

  return {
    languagePopularity,
    submissionOutcomes,
    userGrowth,
    contestGrowth
  };
}
