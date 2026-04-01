import { z } from "zod";
import shortCodeData from "@en-kata/core/data/short-codes.json";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const shortCodeLanguages = Object.keys(shortCodeData) as [string, ...string[]];

export const gameResultRouter = createTRPCRouter({
  save: protectedProcedure
    .input(
      z.object({
        mode: z.enum(["word", "phrase", "code", "paragraph"]),
        difficulty: z.enum(["easy", "medium", "hard"]),
        duration: z.number().int().positive(),
        language: z.enum(shortCodeLanguages).optional(),
        wpm: z.number().int().min(0),
        cpm: z.number().int().min(0),
        accuracy: z.number().min(0).max(100),
        totalChars: z.number().int().min(0),
        correctChars: z.number().int().min(0),
        totalWords: z.number().int().min(0),
        completedWords: z.number().int().min(0),
        mistakeMap: z.record(z.string(), z.number()),
        wpmTimeline: z.array(
          z.object({ second: z.number(), wpm: z.number() }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id as string;
      return ctx.db.gameResult.create({
        data: {
          userId,
          ...input,
        },
      });
    }),

  // Get user's recent results
  getRecent: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id as string;
      return ctx.db.gameResult.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  // Get stats for dashboard
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id as string;

    // Best WPM per mode
    const bestByMode = await ctx.db.gameResult.groupBy({
      by: ["mode"],
      where: { userId },
      _max: { wpm: true },
      _count: true,
    });

    // Recent 30 days results for trend chart
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentResults = await ctx.db.gameResult.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        mode: true,
        wpm: true,
        accuracy: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Overall stats
    const overall = await ctx.db.gameResult.aggregate({
      where: { userId },
      _avg: { wpm: true, accuracy: true },
      _max: { wpm: true },
      _count: true,
    });

    return {
      bestByMode,
      recentResults,
      overall: {
        avgWpm: Math.round(overall._avg.wpm ?? 0),
        avgAccuracy: Math.round(overall._avg.accuracy ?? 0),
        bestWpm: overall._max.wpm ?? 0,
        totalGames: overall._count,
      },
    };
  }),

  // Leaderboard: top scores per mode/difficulty/duration
  getLeaderboard: publicProcedure
    .input(
      z.object({
        mode: z.enum(["word", "phrase", "code", "paragraph"]),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        duration: z.number().int().positive().optional(),
        period: z.enum(["all", "week", "month"]).default("all"),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { mode: input.mode };

      if (input.difficulty) where.difficulty = input.difficulty;
      if (input.duration) where.duration = input.duration;

      if (input.period !== "all") {
        const since = new Date();
        if (input.period === "week") since.setDate(since.getDate() - 7);
        else since.setDate(since.getDate() - 30);
        where.createdAt = { gte: since };
      }

      // Get best WPM per user for this filter, then rank
      const results = await ctx.db.gameResult.findMany({
        where,
        orderBy: { wpm: "desc" },
        select: {
          id: true,
          userId: true,
          wpm: true,
          cpm: true,
          accuracy: true,
          completedWords: true,
          duration: true,
          difficulty: true,
          createdAt: true,
          user: {
            select: { name: true, image: true },
          },
        },
      });

      // Keep only best score per user
      const seen = new Set<string>();
      const ranked = [];
      for (const r of results) {
        if (seen.has(r.userId)) continue;
        seen.add(r.userId);
        ranked.push(r);
        if (ranked.length >= input.limit) break;
      }

      return ranked.map((r, i) => ({
        rank: i + 1,
        userId: r.userId,
        userName: r.user.name ?? "Anonymous",
        userImage: r.user.image,
        wpm: r.wpm,
        cpm: r.cpm,
        accuracy: r.accuracy,
        completedWords: r.completedWords,
        duration: r.duration,
        difficulty: r.difficulty,
        createdAt: r.createdAt,
      }));
    }),
});
