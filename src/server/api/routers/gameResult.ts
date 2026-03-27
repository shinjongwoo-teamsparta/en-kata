import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const gameResultRouter = createTRPCRouter({
  save: protectedProcedure
    .input(
      z.object({
        mode: z.enum(["word", "phrase", "shortCode", "variableName"]),
        difficulty: z.enum(["easy", "medium", "hard"]),
        duration: z.number().int().positive(),
        convention: z
          .enum(["camelCase", "snake_case", "kebab-case", "PascalCase"])
          .optional(),
        language: z.enum(["jsts", "python"]).optional(),
        category: z
          .enum(["general", "frontend", "backend", "devops", "database"])
          .optional(),
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
});
